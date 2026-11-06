/**
 * LipiScript Phase 0 - Live Benchmark Execution (Gate 3)
 * AUTHORIZATION: Explicitly unlocked by user in Turn 11.
 * Evaluates candidate OCR models across the benchmark dataset using strict Indic metrics.
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { BenchmarkOrchestrator } from './candidates/runner_orchestrator.ts';

dotenv.config();

async function runGate3LiveBenchmark() {
  console.log('===============================================================');
  console.log('       LIPISCRIPT OCR BENCHMARK EXECUTION (GATE 3 LIVE)        ');
  console.log('===============================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Authorization: GATE 3 UNLOCKED BY USER (Explicit approval confirmed)`);
  console.log('Frozen Prompt: Preserving original spelling, zero auto-correction.');
  console.log('---------------------------------------------------------------\n');

  // We test gemini-3.8-flash first (primary candidate), then check gemini-4-argon & cloud-vision
  const candidates: ('gemini-3.8-flash' | 'gemini-4-argon' | 'google-cloud-vision-document-text')[] = [
    'gemini-3.8-flash',
  ];

  if (process.env.GEMINI_API_KEY) {
    candidates.push('gemini-4-argon');
  }

  if (process.env.GOOGLE_VISION_API_KEY) {
    candidates.push('google-cloud-vision-document-text');
  }

  const orchestrator = new BenchmarkOrchestrator({
    gate3Authorized: true,
    dryRun: false,
    candidates,
  });

  console.log(`Evaluating candidates: ${candidates.join(', ')}`);
  console.log('Running benchmark across 10 Scored Gold Pages...\n');

  try {
    const { detailedResults, aggregates } = await orchestrator.runGoldBenchmark();

    console.log('\n===============================================================');
    console.log('                  OFFICIAL BENCHMARK SCORECARD                 ');
    console.log('===============================================================');

    for (const agg of aggregates) {
      console.log(`\nCANDIDATE: ${agg.candidateId}`);
      console.log(`  - Grapheme-Cluster CER (GC-CER): ${(agg.averageGraphemeClusterCER * 100).toFixed(2)}%`);
      console.log(`  - Code-Point CER (CP-CER):        ${(agg.averageCodePointCER * 100).toFixed(2)}%`);
      console.log(`  - Lexical WER:                   ${(agg.averageLexicalWER * 100).toFixed(2)}%`);
      console.log(`  - Punctuation Error Rate (PER):  ${(agg.averagePER * 100).toFixed(2)}%`);
      console.log(`  - Unsupported Hallucinations:   ${agg.totalUnsupportedGuesses}`);
      console.log(`  - Average Latency:              ${agg.averageLatencyMs} ms`);
      console.log(`  - Estimated Cost / 1k Pages:     $${agg.estimatedCostPer1kPagesUSD.toFixed(2)}`);
      console.log(`  - Language Breakdown (GC-CER):`);
      console.log(`      * Marathi:  ${(agg.perLanguageCER.marathi * 100).toFixed(2)}%`);
      console.log(`      * Hindi:    ${(agg.perLanguageCER.hindi * 100).toFixed(2)}%`);
      console.log(`      * English:  ${(agg.perLanguageCER.english * 100).toFixed(2)}%`);
      console.log(`      * Mixed:    ${(agg.perLanguageCER.mixed * 100).toFixed(2)}%`);
    }

    console.log('\n===============================================================');
    console.log('Results saved to benchmark/results/latest_benchmark_results.json');
    console.log('Scorecard saved to benchmark/results/latest_scorecard.md');
    console.log('GATE 3 BENCHMARK COMPLETE. Ready for Gate 4 Feasibility Report.');
    console.log('===============================================================');
  } catch (err: any) {
    console.error('Benchmark execution error:', err);
    process.exit(1);
  }
}

runGate3LiveBenchmark();
