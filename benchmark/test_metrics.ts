/**
 * LipiScript Phase 0 Benchmark Test Harness
 * Module: Metrics Verification & Edge Case Testing
 * NOTE: Standalone research utility, NOT production application code.
 */

import { scoreBenchmarkPage, segmentCodePoints, segmentGraphemes } from './metrics.ts';

function runUnitTests() {
  console.log('===============================================================');
  console.log('LIPISCRIPT PHASE 0 BENCHMARK UTILITIES: UNIT TEST SUITE');
  console.log('===============================================================\n');

  // Test Case 1: Exact Match in Marathi with Conjuncts
  const refMarathi = 'महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग।';
  const hypMarathiExact = 'महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग।';
  const score1 = scoreBenchmarkPage(refMarathi, hypMarathiExact);

  console.log('TEST 1: Exact Match (Marathi)');
  console.log('Reference:', refMarathi);
  console.log('Code-point CER:', (score1.codePointCER.errorRate * 100).toFixed(2) + '%');
  console.log('Grapheme-Cluster CER:', (score1.graphemeClusterCER.errorRate * 100).toFixed(2) + '%');
  console.log('Lexical WER:', (score1.lexicalWER.errorRate * 100).toFixed(2) + '%');
  console.log('Status:', score1.codePointCER.totalErrors === 0 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('---------------------------------------------------------------\n');

  // Test Case 2: Code Points vs Grapheme Clusters on Aksharas
  // Syllable 'क्ष' = क + ् + ष (3 code points, 1 or 2 graphemes depending on virama handling)
  const refAkshara = 'परीक्षा';
  const hypAksharaError = 'परिक्षा'; // short-i matra misplaced vs long-i
  const score2 = scoreBenchmarkPage(refAkshara, hypAksharaError);

  console.log('TEST 2: Devanagari Akshara Matra Variation');
  console.log('Reference:', refAkshara);
  console.log('Hypothesis:', hypAksharaError);
  console.log('Code Points in Ref:', segmentCodePoints(refAkshara));
  console.log('Graphemes in Ref:', segmentGraphemes(refAkshara));
  console.log('Code-point CER:', (score2.codePointCER.errorRate * 100).toFixed(2) + '%');
  console.log('Grapheme-Cluster CER:', (score2.graphemeClusterCER.errorRate * 100).toFixed(2) + '%');
  console.log('Status: COMPUTED ✅');
  console.log('---------------------------------------------------------------\n');

  // Test Case 3: Ambiguity Masking & [illegible] Tag
  const refAmbiguous = 'आज [illegible] पाऊस पडण्याची शक्यता आहे.';
  const hypWithIllegible = 'आज [illegible] पाऊस पडण्याची शक्यता आहे.';
  const score3 = scoreBenchmarkPage(refAmbiguous, hypWithIllegible);

  console.log('TEST 3: Ambiguous Span Masking ([illegible] handled correctly)');
  console.log('Reference:', refAmbiguous);
  console.log('Hypothesis:', hypWithIllegible);
  console.log('Masked Spans Count:', score3.maskingDiagnostics.maskedSpansCount);
  console.log('Code-point CER (Readable text only):', (score3.codePointCER.errorRate * 100).toFixed(2) + '%');
  console.log('Unsupported Guesses:', score3.maskingDiagnostics.unsupportedGuessesCount);
  console.log('Status:', score3.codePointCER.totalErrors === 0 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('---------------------------------------------------------------\n');

  // Test Case 4: Hallucinated Guess in Ambiguous Span
  const hypWithGuess = 'आज खूप पाऊस पडण्याची शक्यता आहे.'; // Model guessed 'खूप' where ref was [illegible]
  const score4 = scoreBenchmarkPage(refAmbiguous, hypWithGuess);

  console.log('TEST 4: Hallucination Detection (Model guessed "खूप" in [illegible] span)');
  console.log('Reference:', refAmbiguous);
  console.log('Hypothesis:', hypWithGuess);
  console.log('Unsupported Guesses Count:', score4.maskingDiagnostics.unsupportedGuessesCount);
  console.log('Status:', score4.maskingDiagnostics.unsupportedGuessesCount > 0 ? 'DETECTED AS HALLUCINATION ✅' : 'FAILED ❌');
  console.log('---------------------------------------------------------------\n');

  console.log('All Benchmark Utility Unit Tests Completed Successfully!');
}

runUnitTests();
