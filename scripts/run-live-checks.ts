import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  decomposeSources,
  validateAndEnforceClaim,
  generateContentWithRetry,
} from '../src/evidenceEngine.ts';
import { ClaimOutcome, EvidenceRelationship, ReasoningIssue } from '../src/types.ts';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('FATAL: GEMINI_API_KEY is not defined in environment!');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface LiveTestCase {
  name: string;
  claim: string;
  sourceText: string;
  expectedOutcome: ClaimOutcome | ClaimOutcome[];
  expectedRelationship?: EvidenceRelationship | EvidenceRelationship[];
  expectedIssue?: ReasoningIssue | ReasoningIssue[];
  invalidIdInjectionTest?: boolean;
}

const TEST_CASES: LiveTestCase[] = [
  // 1. Adversarial Twin: Claim A
  {
    name: 'Adversarial Twin A (Exact Match)',
    sourceText: 'Among 50 surveyed students, 40% reported enjoying the learning application.',
    claim: '40% of surveyed students enjoyed the learning application.',
    expectedOutcome: 'Supported',
    expectedRelationship: 'Supports',
    expectedIssue: 'None',
  },
  // 1. Adversarial Twin: Claim B
  {
    name: 'Adversarial Twin B (Metric Trap: enjoyment -> academic performance)',
    sourceText: 'Among 50 surveyed students, 40% reported enjoying the learning application.',
    claim: 'The learning application improved academic performance by 40%.',
    expectedOutcome: ['Overreach detected', 'Needs review'],
    expectedIssue: 'Metric mismatch',
  },
  // 4a. Direct Support
  {
    name: 'Direct Support',
    sourceText: 'Platform telemetry logged 240 active users completing the onboarding tutorial within 15 minutes.',
    claim: '240 active users completed the onboarding tutorial in under 15 minutes.',
    expectedOutcome: 'Supported',
    expectedRelationship: 'Supports',
    expectedIssue: 'None',
  },
  // 4b. Direct Contradiction
  {
    name: 'Direct Contradiction',
    sourceText: 'Quarterly financial audits confirmed net operating income decreased by 14% year over year.',
    claim: 'Net operating income experienced significant growth over the past year.',
    expectedOutcome: 'Contradicted',
    expectedRelationship: 'Contradicts',
  },
  // 4c. Keyword-similar but irrelevant evidence
  {
    name: 'Keyword-similar Irrelevant Evidence',
    sourceText: 'The university announced a $5 million grant for renovating the student dining facility.',
    claim: 'The university invested $5 million in deep learning quantum compute clusters.',
    expectedOutcome: ['Unsupported', 'Needs review'],
    expectedRelationship: ['No relevant evidence', 'Partial support'],
  },
  // 4d. Numeric Mismatch
  {
    name: 'Numeric Mismatch',
    sourceText: 'Customer retention rate reached 65% in the fourth quarter.',
    claim: 'Customer retention rate reached 85% in the fourth quarter.',
    expectedOutcome: ['Contradicted', 'Overreach detected'],
  },
  // 4e. Population Overgeneralization
  {
    name: 'Population Overgeneralization',
    sourceText: 'A pilot study with 12 senior software engineers demonstrated faster code review turnaround times.',
    claim: 'The tool improves workflow speed for all employees across the entire organization.',
    expectedOutcome: ['Overreach detected', 'Needs review'],
    expectedIssue: ['Population leap', 'Generalization leap'],
  },
  // 4f. Missing Evidence / Required Abstention
  {
    name: 'Missing Evidence / Required Abstention',
    sourceText: 'The vehicle comes standard with four side airbags and electronic stability control.',
    claim: 'The vehicle earned a 5-star crash safety score from Euro NCAP.',
    expectedOutcome: ['Unsupported', 'Needs review'],
    expectedRelationship: 'No relevant evidence',
  },
];

async function verifyClaimLive(ai: GoogleGenAI, claimText: string, sourceText: string) {
  const { passages, passageMap } = decomposeSources([
    {
      id: 'S1',
      label: 'Source',
      text: sourceText,
    },
  ]);

  const passagesContext = passages
    .map((p) => `[${p.id}]: "${p.text}"`)
    .join('\n');

  const prompt = `You are ClaimCheck, an evidence integrity verification engine.
Verify this claim against the provided canonical source passages:

CANONICAL SOURCE PASSAGES:
${passagesContext}

CLAIM TO VERIFY:
"${claimText}"

INSTRUCTIONS:
1. Select relevant passage IDs ONLY from: [${passages.map((p) => p.id).join(', ')}]. If no passage is relevant, return [].
2. Classify evidenceRelationship strictly as: "Supports" | "Contradicts" | "Partial support" | "No relevant evidence".
3. Classify reasoningIssue strictly as: "None" | "Metric mismatch" | "Population leap" | "Causal leap" | "Temporal overreach" | "Generalization leap" | "Magnitude inflation".
4. Assign outcome strictly as: "Supported" | "Overreach detected" | "Contradicted" | "Needs review" | "Unsupported".
5. Do NOT mark Supported if numbers match but metrics differ (e.g. satisfaction vs academic performance, revenue vs marketing expense).
6. Return valid JSON.`;

  const response = await generateContentWithRetry(ai, {
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          relevantPassageIds: { type: 'ARRAY', items: { type: 'STRING' } },
          evidenceRelationship: { type: 'STRING' },
          reasoningIssue: { type: 'STRING' },
          outcome: { type: 'STRING' },
          explanation: { type: 'STRING' },
        },
        required: [
          'relevantPassageIds',
          'evidenceRelationship',
          'reasoningIssue',
          'outcome',
          'explanation',
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  const { claim: validated, isValid } = validateAndEnforceClaim(
    { text: claimText, ...parsed },
    passageMap,
    'C-LIVE'
  );

  // Retrieve verbatim text from passage map
  const retrievedPassageText = validated.relevantPassageIds
    .map((id) => passageMap.get(id)?.text)
    .filter(Boolean)
    .join(' ');

  return {
    validated,
    isValid,
    retrievedPassageText,
    passageMap,
  };
}

async function runAllChecks() {
  console.log('================================================================================');
  console.log('CLAIMCHECK LIVE AI EVIDENCE ENGINE VERIFICATION SUITE');
  console.log('Mode: Live AI Evaluation (gemini-3.8-flash via @google/genai)');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================================\n');

  const recordedResults: any[] = [];
  let allPassed = true;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`[Test ${i + 1}/${TEST_CASES.length}] Running: ${tc.name}...`);

    try {
      const res = await verifyClaimLive(ai, tc.claim, tc.sourceText);
      const outcome = res.validated.outcome;
      const relationship = res.validated.evidenceRelationship;
      const issue = res.validated.reasoningIssue;

      // Check Outcome
      const expectedOutcomes = Array.isArray(tc.expectedOutcome)
        ? tc.expectedOutcome
        : [tc.expectedOutcome];
      const outcomePassed = expectedOutcomes.includes(outcome);

      // Check Relationship if specified
      let relPassed = true;
      if (tc.expectedRelationship) {
        const expectedRels = Array.isArray(tc.expectedRelationship)
          ? tc.expectedRelationship
          : [tc.expectedRelationship];
        relPassed = expectedRels.includes(relationship);
      }

      // Check Issue if specified
      let issuePassed = true;
      if (tc.expectedIssue) {
        const expectedIssues = Array.isArray(tc.expectedIssue)
          ? tc.expectedIssue
          : [tc.expectedIssue];
        issuePassed = expectedIssues.includes(issue);
      }

      const passed = outcomePassed && relPassed && issuePassed && res.isValid;
      if (!passed) allPassed = false;

      const record = {
        testNum: i + 1,
        name: tc.name,
        claim: tc.claim,
        passageIds: res.validated.relevantPassageIds,
        retrievedText: res.retrievedPassageText,
        relationship,
        issue,
        outcome,
        expectedOutcome: expectedOutcomes.join(' OR '),
        passFail: passed ? 'PASS' : 'FAIL',
        explanation: res.validated.explanation,
      };

      recordedResults.push(record);

      console.log(`  -> Selected Passages: [${record.passageIds.join(', ')}]`);
      console.log(`  -> Verbatim Text: "${record.retrievedText.slice(0, 70)}..."`);
      console.log(`  -> Relationship: ${relationship} | Issue: ${issue} | Outcome: ${outcome}`);
      console.log(`  -> Expected: ${record.expectedOutcome}`);
      console.log(`  -> Status: ${record.passFail}\n`);

      // Pace requests to respect 5 RPM (12s interval) between consecutive calls
      if (i < TEST_CASES.length - 1) {
        console.log('  [Pacing 12s to respect 5 RPM Free Tier window...]');
        await new Promise((r) => setTimeout(r, 12000));
      }
    } catch (err: any) {
      console.error(`  -> ERROR in ${tc.name}:`, err.message);
      allPassed = false;
      recordedResults.push({
        testNum: i + 1,
        name: tc.name,
        claim: tc.claim,
        passageIds: [],
        retrievedText: 'ERROR',
        relationship: 'ERROR',
        issue: 'ERROR',
        outcome: 'ERROR',
        expectedOutcome: Array.isArray(tc.expectedOutcome) ? tc.expectedOutcome.join(' OR ') : tc.expectedOutcome,
        passFail: 'FAIL',
        explanation: err.message,
      });
    }
  }

  // 3. Test Invalid Passage ID Rejection
  console.log('[Test Bonus: Schema & Invalid Passage ID Rejection Test]');
  const mockSources = [{ id: 'S1', label: 'Source', text: 'Sentence one. Sentence two.' }];
  const { passageMap } = decomposeSources(mockSources);
  const rawHallucinatedClaim = {
    text: 'A test claim',
    relevantPassageIds: ['S1-P1', 'INVALID-P99', 'HALLUCINATED-404'],
    evidenceRelationship: 'Supports',
    reasoningIssue: 'None',
    outcome: 'Supported',
    explanation: 'Model hallucinated non-existent passage IDs.',
  };
  const validationResult = validateAndEnforceClaim(rawHallucinatedClaim, passageMap, 'C-TEST');
  const invalidRejected =
    validationResult.claim.relevantPassageIds.length === 1 &&
    validationResult.claim.relevantPassageIds[0] === 'S1-P1' &&
    validationResult.validationNotes.some((n) => n.includes('Rejected invalid passage ID(s)'));

  console.log('  -> Input Passage IDs:', rawHallucinatedClaim.relevantPassageIds);
  console.log('  -> Filtered Valid IDs:', validationResult.claim.relevantPassageIds);
  console.log('  -> Validation Notes:', validationResult.validationNotes);
  console.log('  -> Invalid ID Rejection Status:', invalidRejected ? 'PASS' : 'FAIL\n');

  console.log('================================================================================');
  console.log('TEST SUMMARY TABLE (LIVE AI EVALUATION)');
  console.log('================================================================================');
  console.table(
    recordedResults.map((r) => ({
      '#': r.testNum,
      Test: r.name,
      PassageID: r.passageIds.join(','),
      Relationship: r.relationship,
      Issue: r.issue,
      Outcome: r.outcome,
      Expected: r.expectedOutcome,
      Result: r.passFail,
    }))
  );

  return { recordedResults, allPassed, invalidRejected };
}

runAllChecks().then((res) => {
  if (!res.allPassed || !res.invalidRejected) {
    console.error('One or more checks did not pass. Process exiting with code 1.');
    process.exit(1);
  } else {
    console.log('ALL LIVE AI VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
});
