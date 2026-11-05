/**
 * LipiScript Phase 0 Benchmark Utility
 * Module: Scoring Metrics (Code-Point CER, Extended Grapheme-Cluster CER, WER, PER & Masking)
 * NOTE: Standalone research utility, NOT production application code.
 */

import { preprocessText } from './normalizer.ts';

export interface EditDistanceResult {
  substitutions: number;
  deletions: number;
  insertions: number;
  totalErrors: number;
  referenceLength: number;
  errorRate: number; // (S + D + I) / N
}

export interface BenchmarkScoreReport {
  referenceRaw: string;
  hypothesisRaw: string;
  normalizedReference: string;
  normalizedHypothesis: string;
  
  // 1. Conventional Code-point CER
  codePointCER: EditDistanceResult;
  
  // 2. Extended Grapheme-Cluster CER (Unicode UAX #29)
  graphemeClusterCER: EditDistanceResult;
  
  // 3. Lexical Word Error Rate (Punctuation-stripped)
  lexicalWER: EditDistanceResult;
  
  // 4. Punctuation Error Rate
  punctuationErrorRate: EditDistanceResult;
  
  // 5. Ambiguity & Masking Diagnostics
  maskingDiagnostics: {
    maskedSpansCount: number;
    unsupportedGuessesCount: number; // Guesses inside [illegible] spans
    falseDeletionCount: number; // Readable words marked [illegible]
  };
}

/**
 * Generic Levenshtein edit distance algorithm for arrays of any type (characters, clusters, words).
 * Returns detailed edit operations: substitutions, deletions, and insertions.
 */
export function computeLevenshtein<T>(reference: T[], hypothesis: T[]): EditDistanceResult {
  const n = reference.length;
  const m = hypothesis.length;

  if (n === 0) {
    return {
      substitutions: 0,
      deletions: 0,
      insertions: m,
      totalErrors: m,
      referenceLength: 0,
      errorRate: m > 0 ? 1.0 : 0.0,
    };
  }

  // Cost matrix: [i][j] stores { cost, s, d, i }
  const dp: { cost: number; s: number; d: number; ins: number }[][] = Array.from(
    { length: n + 1 },
    () => Array.from({ length: m + 1 }, () => ({ cost: 0, s: 0, d: 0, ins: 0 }))
  );

  for (let i = 0; i <= n; i++) {
    dp[i][0] = { cost: i, s: 0, d: i, ins: 0 };
  }
  for (let j = 0; j <= m; j++) {
    dp[0][j] = { cost: j, s: 0, d: 0, ins: j };
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (reference[i - 1] === hypothesis[j - 1]) {
        dp[i][j] = { ...dp[i - 1][j - 1] };
      } else {
        // Option 1: Substitution
        const sub = {
          cost: dp[i - 1][j - 1].cost + 1,
          s: dp[i - 1][j - 1].s + 1,
          d: dp[i - 1][j - 1].d,
          ins: dp[i - 1][j - 1].ins,
        };
        // Option 2: Deletion (omission in hypothesis)
        const del = {
          cost: dp[i - 1][j].cost + 1,
          s: dp[i - 1][j].s,
          d: dp[i - 1][j].d + 1,
          ins: dp[i - 1][j].ins,
        };
        // Option 3: Insertion (extra token in hypothesis)
        const ins = {
          cost: dp[i][j - 1].cost + 1,
          s: dp[i][j - 1].s,
          d: dp[i][j - 1].d,
          ins: dp[i][j - 1].ins + 1,
        };

        // Pick minimum cost
        let minOp = sub;
        if (del.cost < minOp.cost) minOp = del;
        if (ins.cost < minOp.cost) minOp = ins;

        dp[i][j] = minOp;
      }
    }
  }

  const result = dp[n][m];
  const errorRate = n > 0 ? (result.s + result.d + result.ins) / n : 0;

  return {
    substitutions: result.s,
    deletions: result.d,
    insertions: result.ins,
    totalErrors: result.s + result.d + result.ins,
    referenceLength: n,
    errorRate: Math.round(errorRate * 10000) / 10000,
  };
}

/**
 * Splits text into extended grapheme clusters using Unicode UAX #29 standard segmenter.
 */
export function segmentGraphemes(text: string): string[] {
  if (!text) return [];
  // Use Intl.Segmenter with Unicode grapheme granularity
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const clusters: string[] = [];
  for (const item of segmenter.segment(text)) {
    clusters.push(item.segment);
  }
  return clusters;
}

/**
 * Extracts Unicode code points from string (surrogate-pair aware).
 */
export function segmentCodePoints(text: string): string[] {
  if (!text) return [];
  return Array.from(text);
}

/**
 * Tokenizes text for Lexical WER (whitespace split, punctuation stripped).
 */
export function tokenizeLexicalWords(text: string): string[] {
  if (!text) return [];
  const punctuationRegex = /^[।?!,;.—"':()[\]{}]+|[।?!,;.—"':()[\]{}]+$/g;
  return text
    .split(/\s+/)
    .filter(token => token !== '[illegible]' && !token.includes('[illegible]'))
    .map(token => token.replace(punctuationRegex, ''))
    .filter(token => token.length > 0);
}

/**
 * Extracts sequence of punctuation characters for Punctuation Error Rate (PER).
 */
export function extractPunctuationSequence(text: string): string[] {
  if (!text) return [];
  // Indic danda (।) and standard punctuation
  const punctRegex = /[।?!,;.—"':()[\]{}]/g;
  const matches = text.match(punctRegex);
  return matches ? matches : [];
}

/**
 * Evaluates ambiguous [illegible] spans:
 * 1. Counts how many [illegible] tags exist in reference.
 * 2. Detects unsupported guesses made inside [illegible] ground-truth spans.
 * 3. Detects false deletions (clear reference words marked [illegible] by hypothesis).
 */
export function evaluateAmbiguityMasking(
  refRaw: string,
  hypRaw: string
): {
  maskedRef: string;
  maskedHyp: string;
  maskedSpansCount: number;
  unsupportedGuessesCount: number;
  falseDeletionCount: number;
} {
  const refTokens = refRaw.split(/\s+/);
  const hypTokens = hypRaw.split(/\s+/);

  let maskedSpansCount = 0;
  let falseDeletionCount = 0;

  for (const t of refTokens) {
    if (t.includes('[illegible]')) {
      maskedSpansCount++;
    }
  }

  for (const t of hypTokens) {
    if (t.includes('[illegible]') && !refRaw.includes('[illegible]')) {
      falseDeletionCount++;
    }
  }

  // To score readable-text CER/WER without penalizing unreadable spans,
  // we mask out [illegible] tags identically from reference and hypothesis.
  const maskedRef = refRaw.replace(/\[illegible\]/g, '').replace(/\s+/g, ' ').trim();
  const maskedHyp = hypRaw.replace(/\[illegible\]/g, '').replace(/\s+/g, ' ').trim();

  // If hypothesis has more readable tokens than reference where reference was [illegible],
  // record as unsupported guesses.
  const hypWords = tokenizeLexicalWords(hypRaw);
  const refWords = tokenizeLexicalWords(refRaw);
  const unsupportedGuessesCount = Math.max(0, hypWords.length - refWords.length);

  return {
    maskedRef,
    maskedHyp,
    maskedSpansCount,
    unsupportedGuessesCount,
    falseDeletionCount,
  };
}

/**
 * Master benchmark evaluation function.
 * Computes all metrics adhering strictly to LipiScript Phase 0 specifications.
 */
export function scoreBenchmarkPage(
  referenceText: string,
  hypothesisText: string
): BenchmarkScoreReport {
  const normRef = preprocessText(referenceText);
  const normHyp = preprocessText(hypothesisText);

  // 1. Ambiguity Masking & Diagnostics
  const ambiguity = evaluateAmbiguityMasking(normRef, normHyp);

  // 2. Conventional Code-point CER (on masked readable text)
  const refCodePoints = segmentCodePoints(ambiguity.maskedRef);
  const hypCodePoints = segmentCodePoints(ambiguity.maskedHyp);
  const codePointCER = computeLevenshtein(refCodePoints, hypCodePoints);

  // 3. Extended Grapheme-Cluster CER (UAX #29)
  const refGraphemes = segmentGraphemes(ambiguity.maskedRef);
  const hypGraphemes = segmentGraphemes(ambiguity.maskedHyp);
  const graphemeClusterCER = computeLevenshtein(refGraphemes, hypGraphemes);

  // 4. Lexical WER (punctuation-stripped)
  const refWords = tokenizeLexicalWords(ambiguity.maskedRef);
  const hypWords = tokenizeLexicalWords(ambiguity.maskedHyp);
  const lexicalWER = computeLevenshtein(refWords, hypWords);

  // 5. Punctuation Error Rate (PER)
  const refPunct = extractPunctuationSequence(normRef);
  const hypPunct = extractPunctuationSequence(normHyp);
  const punctuationErrorRate = computeLevenshtein(refPunct, hypPunct);

  return {
    referenceRaw: referenceText,
    hypothesisRaw: hypothesisText,
    normalizedReference: normRef,
    normalizedHypothesis: normHyp,
    codePointCER,
    graphemeClusterCER,
    lexicalWER,
    punctuationErrorRate,
    maskingDiagnostics: {
      maskedSpansCount: ambiguity.maskedSpansCount,
      unsupportedGuessesCount: ambiguity.unsupportedGuessesCount,
      falseDeletionCount: ambiguity.falseDeletionCount,
    },
  };
}
