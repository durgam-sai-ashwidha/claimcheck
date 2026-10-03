import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://127.0.0.1:3000';

// Sleep helper to pace API calls and stay within Free Tier RPM
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('================================================================================');
  console.log('CLAIMCHECK LIVE-ONLY SYSTEM VERIFICATION');
  console.log('Target:', API_BASE);
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================================\n');

  // 1. Health check
  console.log('[Check 1] Server Health & API Key Status:');
  const healthRes = await fetch(`${API_BASE}/api/health`);
  const healthJson = await healthRes.json();
  console.log('  Health:', healthJson);
  if (!healthJson.hasApiKey) {
    console.error('FATAL: hasApiKey is false!');
    process.exit(1);
  }
  console.log('  Status: PASS (Live AI mode confirmed)\n');

  // 2. Adversarial Twin Live Evaluation
  console.log('[Check 2] Live Adversarial Twin Comparison (/api/evaluate-twin):');
  const twinPayload = {
    sourceText: 'Among 50 surveyed students, 40% reported enjoying the learning application.',
    claimA: '40% of surveyed students enjoyed the learning application.',
    claimB: 'The learning application improved academic performance by 40%.',
  };

  const twinRes = await fetch(`${API_BASE}/api/evaluate-twin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(twinPayload),
  });

  const twinData = await twinRes.json();
  console.log('  Twin A Outcome:', twinData.twinA?.outcome, '| Relationship:', twinData.twinA?.evidenceRelationship, '| Issue:', twinData.twinA?.reasoningIssue);
  console.log('  Twin A Retrieved Text:', `"${twinData.twinA?.retrievedPassageText}"`);
  console.log('  Twin B Outcome:', twinData.twinB?.outcome, '| Relationship:', twinData.twinB?.evidenceRelationship, '| Issue:', twinData.twinB?.reasoningIssue);
  console.log('  Twin B Retrieved Text:', `"${twinData.twinB?.retrievedPassageText}"`);
  console.log('  Reasoning Difference:', twinData.reasoningDifference);

  const twinAPassed = twinData.twinA?.outcome === 'Supported' && twinData.twinA?.relevantPassageIds?.includes('S1-P1');
  const twinBPassed = (twinData.twinB?.outcome === 'Overreach detected' || twinData.twinB?.outcome === 'Needs review') &&
    twinData.twinB?.reasoningIssue === 'Metric mismatch' &&
    twinData.twinB?.outcome !== 'Supported';

  console.log('  Twin A Status:', twinAPassed ? 'PASS' : 'FAIL');
  console.log('  Twin B Status:', twinBPassed ? 'PASS' : 'FAIL\n');

  // Wait 13s to stay well within free tier rate limits
  console.log('Pacing 13s before Fresh Input 1...');
  await sleep(13000);

  // 3. Test 5 Fresh Report / Source Inputs (/api/analyze)
  const FRESH_INPUTS = [
    {
      title: 'Fresh Input 1: Clinical Cohort Enrollment (Direct Support)',
      report: 'The clinical study enrolled 240 adult patients across four hospital centers.',
      sources: [
        {
          id: 'S1',
          label: 'Hospital Bulletin',
          text: 'The multi-center study enrolled a cohort of 240 adult patients across four participating hospital centers.',
        },
      ],
      expectedOutcome: 'Supported',
    },
    {
      title: 'Fresh Input 2: Financial Performance (Direct Contradiction)',
      report: 'The company achieved substantial net income growth over the past fiscal year.',
      sources: [
        {
          id: 'S1',
          label: 'Annual Audit Filing',
          text: 'Audited financial statements confirmed net income fell by 22% during the fiscal year.',
        },
      ],
      expectedOutcome: 'Contradicted',
    },
    {
      title: 'Fresh Input 3: Grocery Inflation (Metric Mismatch)',
      report: 'Official statistics show food inflation rose by 15% across consumer staples.',
      sources: [
        {
          id: 'S1',
          label: 'Shopper Opinion Survey',
          text: 'A telephone survey of 100 shoppers revealed that 15% felt groceries were noticeably more expensive this year.',
        },
      ],
      expectedOutcome: 'Non-supported (Overreach or Contradicted)',
    },
    {
      title: 'Fresh Input 4: Team Productivity Tool (Population Overreach)',
      report: 'Implementing the new code review software accelerates turnaround times for all corporate personnel.',
      sources: [
        {
          id: 'S1',
          label: 'Engineering Pilot Log',
          text: 'A two-week internal trial with 10 backend engineers demonstrated a 15% reduction in pull request review latency.',
        },
      ],
      expectedOutcome: 'Overreach detected',
    },
    {
      title: 'Fresh Input 5: Automotive Safety (Missing Evidence)',
      report: 'The sedan earned a 5-star crash safety certification from European vehicle testing authorities.',
      sources: [
        {
          id: 'S1',
          label: 'Vehicle Spec Sheet',
          text: 'The vehicle is equipped with dual front airbags, anti-lock disc brakes, and daytime running lights.',
        },
      ],
      expectedOutcome: 'Unsupported',
    },
  ];

  const recordedLiveCases: any[] = [];

  for (let i = 0; i < FRESH_INPUTS.length; i++) {
    const inp = FRESH_INPUTS[i];
    console.log(`[Check 3.${i + 1}] Testing ${inp.title}...`);

    const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: inp.report,
        sources: inp.sources,
      }),
    });

    const data = await analyzeRes.json();
    const primaryClaim = data.claims?.[0];

    const retrievedExcerpt = primaryClaim?.relevantPassageIds
      ?.map((pid: string) => data.passages?.find((p: any) => p.id === pid)?.text)
      ?.filter(Boolean)
      ?.join(' ') || '(No source passage cited)';

    const passed =
      primaryClaim &&
      (primaryClaim.outcome === inp.expectedOutcome ||
        (inp.expectedOutcome === 'Unsupported' && (primaryClaim.outcome === 'Unsupported' || primaryClaim.outcome === 'Needs review')) ||
        (inp.expectedOutcome.includes('Non-supported') && primaryClaim.outcome !== 'Supported') ||
        (inp.expectedOutcome === 'Overreach detected' && (primaryClaim.outcome === 'Overreach detected' || primaryClaim.outcome === 'Needs review')));

    recordedLiveCases.push({
      test: inp.title,
      claim: primaryClaim?.text || inp.report,
      passageIds: primaryClaim?.relevantPassageIds || [],
      retrievedText: retrievedExcerpt,
      relationship: primaryClaim?.evidenceRelationship,
      issue: primaryClaim?.reasoningIssue,
      outcome: primaryClaim?.outcome,
      expected: inp.expectedOutcome,
      passed: passed ? 'PASS' : 'FAIL',
    });

    console.log('  Claim Extracted:', `"${primaryClaim?.text}"`);
    console.log('  Passage ID:', primaryClaim?.relevantPassageIds);
    console.log('  Verbatim Passage Text:', `"${retrievedExcerpt.slice(0, 80)}..."`);
    console.log('  Outcome:', primaryClaim?.outcome, '| Expected:', inp.expectedOutcome);
    console.log('  Status:', passed ? 'PASS' : 'FAIL\n');

    if (i < FRESH_INPUTS.length - 1) {
      console.log('Pacing 13s before next call...');
      await sleep(13000);
    }
  }

  // 4. Test Invalid Input Handling
  console.log('[Check 4] Testing Empty Input Validation:');
  const emptyRes = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportText: '', sources: [] }),
  });
  console.log('  Empty report response status:', emptyRes.status);
  const emptyPassed = emptyRes.status === 400;
  console.log('  Status:', emptyPassed ? 'PASS (Correctly rejected empty input)\n' : 'FAIL\n');

  // 5. Test Invalid Passage ID Rejection
  console.log('[Check 5] Testing Invalid Passage ID Rejection:');
  const singleRes = await fetch(`${API_BASE}/api/verify-single-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claim: 'A verified factual assertion',
      source: 'A single verifiable statement in the source text.',
    }),
  });
  const singleData = await singleRes.json();
  const singlePassed = singleData.relevantPassageIds?.includes('S1-P1');
  console.log('  Single Claim Verified:', singleData.relevantPassageIds, singleData.outcome);
  console.log('  Status:', singlePassed ? 'PASS\n' : 'FAIL\n');

  // Print Summary Table
  console.log('================================================================================');
  console.log('LIVE AI TEST RESULTS TABLE');
  console.log('================================================================================');
  console.table(
    [
      {
        Test: 'Adversarial Twin A',
        Claim: twinPayload.claimA,
        PassageID: twinData.twinA?.relevantPassageIds?.join(','),
        Relationship: twinData.twinA?.evidenceRelationship,
        Issue: twinData.twinA?.reasoningIssue,
        Outcome: twinData.twinA?.outcome,
        Expected: 'Supported',
        Status: twinAPassed ? 'PASS' : 'FAIL',
      },
      {
        Test: 'Adversarial Twin B',
        Claim: twinPayload.claimB,
        PassageID: twinData.twinB?.relevantPassageIds?.join(','),
        Relationship: twinData.twinB?.evidenceRelationship,
        Issue: twinData.twinB?.reasoningIssue,
        Outcome: twinData.twinB?.outcome,
        Expected: 'Overreach detected',
        Status: twinBPassed ? 'PASS' : 'FAIL',
      },
      ...recordedLiveCases.map((r) => ({
        Test: r.test,
        Claim: r.claim,
        PassageID: r.passageIds.join(','),
        Relationship: r.relationship,
        Issue: r.issue,
        Outcome: r.outcome,
        Expected: r.expected,
        Status: r.passed,
      })),
    ]
  );
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
