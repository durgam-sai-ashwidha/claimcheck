import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://127.0.0.1:3000';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runHardenedStateTests() {
  console.log('================================================================================');
  console.log('TESTING HARDENED CLAIMCHECK UI/UX AND BACKEND STATES');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================================\n');

  // Test 1: Empty Form (Report is empty)
  console.log('[Test 1] Testing Empty Report validation:');
  const res1 = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportText: '',
      sources: [{ id: 'S1', label: 'Source 1', text: 'Some text here.' }],
    }),
  });
  const data1 = await res1.json();
  console.log('  Status:', res1.status, '| Error:', data1.error);
  const test1Passed = res1.status === 400 && data1.error.includes('Report text is required');
  console.log('  Result:', test1Passed ? 'PASS' : 'FAIL\n');

  // Test 2: Missing Source validation
  console.log('[Test 2] Testing Missing Source validation:');
  const res2 = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportText: 'A report with valid text but no sources provided.',
      sources: [],
    }),
  });
  const data2 = await res2.json();
  console.log('  Status:', res2.status, '| Error:', data2.error);
  const test2Passed = res2.status === 400 && data2.error.includes('at least 1 source document');
  console.log('  Result:', test2Passed ? 'PASS' : 'FAIL\n');

  // Test 3: No Secret / API Key Leakage Confirmation
  console.log('[Test 3] Verifying no raw secrets or API keys leaked in responses:');
  const healthRes = await fetch(`${API_BASE}/api/health`);
  const healthData = await healthRes.json();
  const rawHealthStr = JSON.stringify(healthData);
  const leakedKey = process.env.GEMINI_API_KEY && rawHealthStr.includes(process.env.GEMINI_API_KEY);
  console.log('  Health response hasApiKey:', healthData.hasApiKey, '| Raw key exposed:', Boolean(leakedKey));
  const test3Passed = healthData.hasApiKey === true && !leakedKey;
  console.log('  Result:', test3Passed ? 'PASS' : 'FAIL\n');

  // Test 4: Unsupported Claim (No evidence is a valid analytical result, NOT an error)
  console.log('[Test 4] Testing Unsupported Claim (Analytical result: No passage establishes claim):');
  const res4 = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportText: 'The aerospace firm successfully landed an uncrewed rover on Europa.',
      sources: [
        {
          id: 'S1',
          label: 'Weather Station Log',
          text: 'Rainfall in the eastern valley reached 42 millimeters over the weekend.',
        },
      ],
    }),
  });
  const data4 = await res4.json();
  const primaryClaim4 = data4.claims?.[0];
  console.log('  Claim Extracted:', `"${primaryClaim4?.text}"`);
  console.log('  Outcome:', primaryClaim4?.outcome);
  console.log('  Relationship:', primaryClaim4?.evidenceRelationship);
  console.log('  Passage IDs cited:', primaryClaim4?.relevantPassageIds);
  const test4Passed =
    primaryClaim4 &&
    (primaryClaim4.outcome === 'Unsupported' || primaryClaim4.outcome === 'Needs review') &&
    (primaryClaim4.evidenceRelationship === 'No relevant evidence' || primaryClaim4.relevantPassageIds.length === 0);
  console.log('  Result:', test4Passed ? 'PASS (Correct analytical non-support verdict)' : 'FAIL\n');

  // Pacing before next call
  console.log('Pacing 13s before Test 5...');
  await sleep(13000);

  // Test 5: Valid Live Analysis with Verbatim Passages
  console.log('[Test 5] Testing Valid Live Analysis and Verbatim Excerpt retrieval:');
  const sampleSourceText = 'Clinical trial CT-409 registered 180 pediatric participants across 3 university hospitals.';
  const res5 = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportText: 'The trial registered 180 pediatric participants across 3 university hospitals.',
      sources: [
        {
          id: 'S1',
          label: 'Clinical Registry',
          text: sampleSourceText,
        },
      ],
    }),
  });
  const data5 = await res5.json();
  const claim5 = data5.claims?.[0];
  const passage5 = data5.passages?.find((p: any) => p.id === claim5?.relevantPassageIds?.[0]);
  console.log('  Claim:', `"${claim5?.text}"`);
  console.log('  Passage ID:', claim5?.relevantPassageIds?.[0]);
  console.log('  Verbatim Source Text in Map:', `"${passage5?.text}"`);
  console.log('  Original Source Text:', `"${sampleSourceText}"`);
  const verbatimMatch = passage5?.text === sampleSourceText;
  const test5Passed = claim5?.outcome === 'Supported' && verbatimMatch;
  console.log('  Verbatim match:', verbatimMatch);
  console.log('  Result:', test5Passed ? 'PASS' : 'FAIL\n');

  // Print Summary
  console.log('================================================================================');
  console.log('HARDENED STATE VERIFICATION SUMMARY:');
  console.table([
    { Test: '1. Empty Report Validation', Status: test1Passed ? 'PASS' : 'FAIL' },
    { Test: '2. Missing Source Validation', Status: test2Passed ? 'PASS' : 'FAIL' },
    { Test: '3. Secret & Key Protection', Status: test3Passed ? 'PASS' : 'FAIL' },
    { Test: '4. Unsupported Claim Valid Analytical Result', Status: test4Passed ? 'PASS' : 'FAIL' },
    { Test: '5. Verbatim Passage Map Integrity', Status: test5Passed ? 'PASS' : 'FAIL' },
  ]);
}

runHardenedStateTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
