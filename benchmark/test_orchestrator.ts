/**
 * Verification test for BenchmarkOrchestrator
 * Tests:
 * 1. Gate 3 Lock enforcement (must throw error if live benchmark requested without authorization).
 * 2. Dry-run pipeline execution and scorecard generation.
 */

import { BenchmarkOrchestrator } from './candidates/runner_orchestrator.ts';

async function testOrchestrator() {
  console.log('--- TEST 1: Verifying Gate 3 Safety Policy Lock ---');
  const lockedOrchestrator = new BenchmarkOrchestrator({ gate3Authorized: false, dryRun: false });
  let threwExpectedError = false;

  try {
    lockedOrchestrator.verifyGateLock();
  } catch (err: any) {
    if (err.message.includes('GATE 3 LOCK ENFORCED')) {
      threwExpectedError = true;
      console.log('✅ Gate 3 lock successfully enforced. Blocked unauthorized live OCR call.');
    } else {
      console.error('❌ Unexpected error:', err);
    }
  }

  if (!threwExpectedError) {
    throw new Error('FAIL: Gate 3 lock failed to trigger!');
  }

  console.log('\n--- TEST 2: Verifying Dry-Run Pipeline & Scorecard Generation ---');
  const dryRunner = new BenchmarkOrchestrator({
    dryRun: true,
    candidates: ['gemini-3.8-flash', 'gemini-4-argon', 'google-cloud-vision-document-text'],
  });

  const { detailedResults, aggregates } = await dryRunner.runGoldBenchmark();
  console.log(`✅ Processed ${detailedResults.length} page evaluations in dry-run mode.`);
  console.log(`✅ Generated summary aggregates for ${aggregates.length} candidates:`);

  for (const agg of aggregates) {
    console.log(
      `   - ${agg.candidateId}: Latency=${agg.averageLatencyMs}ms, EstCost=$${agg.estimatedCostPer1kPagesUSD}/1k pages`
    );
  }

  console.log('\nAll orchestrator safety & pipeline tests PASSED!');
}

testOrchestrator().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
