/**
 * LipiScript Phase 0 Benchmark Orchestrator
 * Module: Multi-Candidate Evaluation & Scoring Orchestrator
 *
 * SAFETY & GOVERNANCE:
 * - Gate 3 Lock: This orchestrator strictly checks `gate3Authorized: true`.
 * - If Gate 3 is locked, it refuses live API execution and guides the user.
 * - Supports dryRun mode for deterministic pipeline verification without API spend.
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { scoreBenchmarkPage, BenchmarkScoreReport } from '../metrics.ts';
import { runGeminiCandidate, CandidateRunResult } from './gemini_runner.ts';
import { runCloudVisionCandidate } from './cloud_vision_runner.ts';
import { runOpenAICandidate } from './openai_runner.ts';

export type CandidateId =
  | 'gemini-3.8-flash'
  | 'gemini-4-argon'
  | 'google-cloud-vision-document-text'
  | 'gpt-4o';

export interface PageBenchmarkResult {
  pageId: string;
  language: string;
  difficulty: string;
  candidateId: CandidateId;
  rawText: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  scoreReport?: BenchmarkScoreReport;
}

export interface CandidateAggregateSummary {
  candidateId: CandidateId;
  successfulPages: number;
  failedPages: number;
  averageLatencyMs: number;
  averageCodePointCER: number;
  averageGraphemeClusterCER: number;
  averageLexicalWER: number;
  averagePER: number;
  totalUnsupportedGuesses: number;
  estimatedCostPer1kPagesUSD: number;
  perLanguageCER: {
    marathi: number;
    hindi: number;
    english: number;
    mixed: number;
  };
}

export interface OrchestratorOptions {
  gate3Authorized?: boolean;
  dryRun?: boolean;
  candidates?: CandidateId[];
  pagesDir?: string;
  transcriptsDir?: string;
  outputDir?: string;
  geminiApiKey?: string;
  visionApiKey?: string;
  openaiApiKey?: string;
}

// Officially verified pricing (November 2026)
const PRICING_PER_1K_PAGES_USD: Record<CandidateId, number> = {
  // Assuming ~1,600 tokens/page (image + text)
  'gemini-3.8-flash': 1.2, // $0.75/$3.75 blended intro rate ~ $1.20 / 1k pages
  'gemini-4-argon': 3.2, // $2.00/$10.00 blended intro rate ~ $3.20 / 1k pages
  'google-cloud-vision-document-text': 1.5, // Standard $1.50 per 1,000 units
  'gpt-4o': 5.0, // Deprecated API, standard legacy rate ~ $5.00 / 1k pages
};

export class BenchmarkOrchestrator {
  private gate3Authorized: boolean;
  private dryRun: boolean;
  private candidates: CandidateId[];
  private manifestPath: string;
  private transcriptsDir: string;
  private imagesDir: string;
  private outputDir: string;
  private geminiApiKey?: string;
  private visionApiKey?: string;
  private openaiApiKey?: string;

  constructor(options: OrchestratorOptions = {}) {
    this.gate3Authorized = !!options.gate3Authorized || process.env.GATE_3_AUTHORIZED === 'true';
    this.dryRun = !!options.dryRun;
    this.geminiApiKey = options.geminiApiKey;
    this.visionApiKey = options.visionApiKey;
    this.openaiApiKey = options.openaiApiKey;
    this.candidates = options.candidates || [
      'gemini-3.8-flash',
      'gemini-4-argon',
      'google-cloud-vision-document-text',
    ];

    const benchmarkRoot = path.resolve(process.cwd(), 'benchmark');
    this.manifestPath = path.join(benchmarkRoot, 'dataset', 'manifest.json');
    this.transcriptsDir = options.transcriptsDir || path.join(benchmarkRoot, 'dataset', 'transcripts');
    this.imagesDir = options.pagesDir || path.join(benchmarkRoot, 'dataset', 'images');
    this.outputDir = options.outputDir || path.join(benchmarkRoot, 'results');
  }

  /**
   * Verify gate safety policy
   */
  public verifyGateLock(): void {
    if (!this.gate3Authorized && !this.dryRun) {
      throw new Error(
        'GATE 3 LOCK ENFORCED: Live OCR benchmark execution is currently locked.\n' +
        'Per LipiScript governance, you must obtain explicit user authorization for Gate 3.\n' +
        'To simulate the benchmark pipeline safely without API calls, pass { dryRun: true }.'
      );
    }
  }

  /**
   * Run candidate execution for a single page
   */
  public async executeCandidateOnPage(
    candidateId: CandidateId,
    imageBase64: string
  ): Promise<CandidateRunResult> {
    if (this.dryRun) {
      // Deterministic simulation response for pipeline testing
      return {
        modelId: candidateId,
        rawText: `[Simulated dry-run output for ${candidateId}]`,
        latencyMs: 420,
        inputTokens: 1200,
        outputTokens: 150,
      };
    }

    this.verifyGateLock();

    switch (candidateId) {
      case 'gemini-3.8-flash':
        return await runGeminiCandidate('gemini-3.8-flash', imageBase64, 'image/png', this.geminiApiKey);
      case 'gemini-4-argon':
        return await runGeminiCandidate('gemini-4-argon', imageBase64, 'image/png', this.geminiApiKey);
      case 'google-cloud-vision-document-text':
        return await runCloudVisionCandidate(imageBase64, { apiKey: this.visionApiKey });
      case 'gpt-4o':
        return await runOpenAICandidate(imageBase64, { apiKey: this.openaiApiKey });
      default:
        throw new Error(`Unsupported candidate ID: ${candidateId}`);
    }
  }

  /**
   * Run benchmark on all available gold pages with transcripts
   */
  public async runGoldBenchmark(): Promise<{
    detailedResults: PageBenchmarkResult[];
    aggregates: CandidateAggregateSummary[];
  }> {
    this.verifyGateLock();

    if (!fs.existsSync(this.manifestPath)) {
      throw new Error(`Dataset manifest not found at ${this.manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    const goldPages = manifest.pages.filter((p: any) => p.type === 'gold');

    const detailedResults: PageBenchmarkResult[] = [];

    for (const page of goldPages) {
      const transcriptFile = path.join(this.transcriptsDir, page.transcriptFile || `${page.id}_transcript.txt`);
      let referenceText = '';

      if (fs.existsSync(transcriptFile)) {
        referenceText = fs.readFileSync(transcriptFile, 'utf8');
      } else {
        // If transcript not yet uploaded, skip scoring or mark pending
        referenceText = '';
      }

      const imageFile = page.imageFile ? path.join(this.imagesDir, page.imageFile) : null;
      let imageBase64 = '';

      if (imageFile && fs.existsSync(imageFile)) {
        if (imageFile.endsWith('.svg')) {
          const svgContent = fs.readFileSync(imageFile);
          const pngBuffer = await sharp(svgContent).png().toBuffer();
          imageBase64 = pngBuffer.toString('base64');
        } else {
          imageBase64 = fs.readFileSync(imageFile).toString('base64');
        }
      } else {
        // Fallback placeholder base64 for dryRun if image not uploaded yet
        imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }

      for (const candidateId of this.candidates) {
        let runResult: CandidateRunResult;

        try {
          runResult = await this.executeCandidateOnPage(candidateId, imageBase64);
        } catch (err: any) {
          runResult = {
            modelId: candidateId,
            rawText: '',
            latencyMs: 0,
            error: err.message,
          };
        }

        let scoreReport: BenchmarkScoreReport | undefined;
        if (referenceText && runResult.rawText && !runResult.error) {
          scoreReport = scoreBenchmarkPage(referenceText, runResult.rawText);
        }

        detailedResults.push({
          pageId: page.id,
          language: page.language,
          difficulty: page.difficulty,
          candidateId,
          rawText: runResult.rawText,
          latencyMs: runResult.latencyMs,
          inputTokens: runResult.inputTokens,
          outputTokens: runResult.outputTokens,
          error: runResult.error,
          scoreReport,
        });
      }
    }

    const aggregates = this.computeAggregates(detailedResults);

    // Save outputs if directory exists or create it
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.outputDir, 'latest_benchmark_results.json'),
      JSON.stringify({ detailedResults, aggregates }, null, 2),
      'utf8'
    );

    const markdownReport = this.generateMarkdownReport(aggregates);
    fs.writeFileSync(path.join(this.outputDir, 'latest_scorecard.md'), markdownReport, 'utf8');

    return { detailedResults, aggregates };
  }

  /**
   * Compute aggregate summary statistics
   */
  private computeAggregates(results: PageBenchmarkResult[]): CandidateAggregateSummary[] {
    const candidateMap = new Map<CandidateId, PageBenchmarkResult[]>();

    for (const r of results) {
      if (!candidateMap.has(r.candidateId)) {
        candidateMap.set(r.candidateId, []);
      }
      candidateMap.get(r.candidateId)!.push(r);
    }

    const summaries: CandidateAggregateSummary[] = [];

    for (const [candidateId, items] of candidateMap.entries()) {
      const scoredItems = items.filter((i) => i.scoreReport && !i.error);
      const failedItems = items.filter((i) => i.error);

      const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

      const latencies = items.map((i) => i.latencyMs);
      const codePointCERs = scoredItems.map((i) => i.scoreReport!.codePointCER.errorRate);
      const gcCERs = scoredItems.map((i) => i.scoreReport!.graphemeClusterCER.errorRate);
      const werList = scoredItems.map((i) => i.scoreReport!.lexicalWER.errorRate);
      const perList = scoredItems.map((i) => i.scoreReport!.punctuationErrorRate.errorRate);
      const totalGuesses = scoredItems.reduce(
        (sum, i) => sum + i.scoreReport!.maskingDiagnostics.unsupportedGuessesCount,
        0
      );

      // Per-language CER
      const langCER = (lang: string) => {
        const langItems = scoredItems.filter((i) => i.language.toLowerCase().includes(lang.toLowerCase()));
        return avg(langItems.map((i) => i.scoreReport!.graphemeClusterCER.errorRate));
      };

      summaries.push({
        candidateId,
        successfulPages: scoredItems.length,
        failedPages: failedItems.length,
        averageLatencyMs: Math.round(avg(latencies)),
        averageCodePointCER: Number(avg(codePointCERs).toFixed(4)),
        averageGraphemeClusterCER: Number(avg(gcCERs).toFixed(4)),
        averageLexicalWER: Number(avg(werList).toFixed(4)),
        averagePER: Number(avg(perList).toFixed(4)),
        totalUnsupportedGuesses: totalGuesses,
        estimatedCostPer1kPagesUSD: PRICING_PER_1K_PAGES_USD[candidateId] || 0,
        perLanguageCER: {
          marathi: Number(langCER('marathi').toFixed(4)),
          hindi: Number(langCER('hindi').toFixed(4)),
          english: Number(langCER('english').toFixed(4)),
          mixed: Number(langCER('mixed').toFixed(4)),
        },
      });
    }

    return summaries;
  }

  /**
   * Generate clean Markdown scorecard
   */
  public generateMarkdownReport(aggregates: CandidateAggregateSummary[]): string {
    let md = '# LipiScript OCR Benchmark Scorecard\n\n';
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Status: ${this.dryRun ? 'SIMULATED DRY-RUN (Pre-Gate 3 Test)' : 'LIVE OCR BENCHMARK'}\n\n`;

    md += '| Candidate Model | Avg GC-CER | Avg CP-CER | Avg Lexical WER | Latency (ms) | Unsupported Guesses | Est. Cost / 1k Pages |\n';
    md += '|---|---|---|---|---|---|---|\n';

    for (const a of aggregates) {
      md += `| **${a.candidateId}** | ${(a.averageGraphemeClusterCER * 100).toFixed(2)}% | ${(a.averageCodePointCER * 100).toFixed(2)}% | ${(a.averageLexicalWER * 100).toFixed(2)}% | ${a.averageLatencyMs} ms | ${a.totalUnsupportedGuesses} | $${a.estimatedCostPer1kPagesUSD.toFixed(2)} |\n`;
    }

    md += '\n### Language Breakdown (GC-CER)\n\n';
    md += '| Candidate Model | Marathi | Hindi | English | Mixed |\n';
    md += '|---|---|---|---|---|\n';

    for (const a of aggregates) {
      md += `| **${a.candidateId}** | ${(a.perLanguageCER.marathi * 100).toFixed(2)}% | ${(a.perLanguageCER.hindi * 100).toFixed(2)}% | ${(a.perLanguageCER.english * 100).toFixed(2)}% | ${(a.perLanguageCER.mixed * 100).toFixed(2)}% |\n`;
    }

    return md;
  }
}
