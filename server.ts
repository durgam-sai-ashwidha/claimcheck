import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { SourcePassage, SourceDocument, ClaimAnalysis, AnalysisResult } from './src/types.ts';
import { decomposeSources, validateAndEnforceClaim, generateContentWithRetry } from './src/evidenceEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    model: 'gemini-3.1-flash-lite',
    mode: 'live',
  });
});

// Live Claim Analysis Endpoint (LIVE ONLY)
app.post('/api/analyze', async (req: Request, res: Response) => {
  if (!ai || !apiKey) {
    return res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }

  try {
    const { reportText, sources } = req.body;

    if (!reportText || !String(reportText).trim()) {
      return res.status(400).json({ error: 'Report text is required.' });
    }

    const validatedSources: SourceDocument[] = Array.isArray(sources) && sources.length > 0
      ? sources
          .filter((s) => s && s.text && String(s.text).trim().length > 0)
          .map((s, idx) => ({
            id: s.id || `S${idx + 1}`,
            label: s.label || `Source ${idx + 1}`,
            text: String(s.text).trim(),
          }))
      : [];

    if (validatedSources.length === 0) {
      return res.status(400).json({ error: 'Please provide at least 1 source document with text.' });
    }

    // Step 1: Decompose sources into canonical passages with stable IDs (e.g. S1-P1, S1-P2)
    const { passages, passageMap } = decomposeSources(validatedSources);

    if (passages.length === 0) {
      return res.status(400).json({ error: 'Source documents contained no valid sentences to analyze.' });
    }

    // Build canonical passages reference for prompt
    const passagesContext = passages
      .map((p) => `[${p.id}] (${p.sourceLabel}): "${p.text}"`)
      .join('\n');

    const prompt = `You are ClaimCheck, an evidence integrity and claim verification engine.
Analyze the following report and cross-reference its claims against the supplied canonical source passages.

REPORT TO ANALYZE:
"""
${reportText}
"""

CANONICAL SOURCE PASSAGES:
${passagesContext}

CRITICAL INSTRUCTIONS:
1. Extract atomic, discrete claims made in the report text (extract 1 to 6 claims depending on report length). You MUST preserve all quantifiers, scope modifiers, and population targets (e.g. "all", "entire organization", "all corporate personnel", "every student", "causes", "permanently") exactly as stated in the report. NEVER strip or truncate population or scope words from the claim text.
2. For each claim, select relevant passage IDs ONLY from this exact valid list: [${passages.map((p) => p.id).join(', ')}]. If no source passage is relevant, return an empty array [].
3. DO NOT mark a claim Supported just because of lexical similarity or matching numbers.
   * Example: If the source says "40% reported enjoying the application" and the claim says "improved academic performance by 40%", this is a METRIC MISMATCH and must be classified as "Overreach detected" (or "Needs review").
   * Example: If the source evaluated a small or specific sample (e.g. 10 engineers) and the claim asserts efficacy for "all corporate personnel" or "entire organization", this is a POPULATION LEAP and must be classified as "Overreach detected".
4. evidenceRelationship MUST be one of: "Supports" | "Contradicts" | "Partial support" | "No relevant evidence".
5. reasoningIssue MUST be one of: "None" | "Metric mismatch" | "Population leap" | "Causal leap" | "Temporal overreach" | "Generalization leap" | "Magnitude inflation".
6. outcome MUST be one of: "Supported" | "Overreach detected" | "Contradicted" | "Needs review" | "Unsupported".
   * RULE: A claim CANNOT have outcome "Supported" if evidenceRelationship is "Partial support", "Contradicts", or "No relevant evidence", or if any reasoningIssue is detected. If evidence is partial or overreaching, assign "Overreach detected" or "Needs review".
7. Keep relationship, reasoning_issue, and outcome strictly separated in distinct fields.
8. If evidence is missing, contradictory, or uncertain, use "Needs review" or "Unsupported".`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of atomic claim verification analyses',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Claim ID like C-01, C-02' },
              text: { type: Type.STRING, description: 'The exact atomic claim' },
              claimType: {
                type: Type.STRING,
                description: 'Claim category: Factual, Causal, Generalization, Predictive, Comparative',
              },
              relevantPassageIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Valid passage IDs from the source text (e.g. S1-P1)',
              },
              evidenceRelationship: {
                type: Type.STRING,
                description: 'Supports | Contradicts | Partial support | No relevant evidence',
              },
              reasoningIssue: {
                type: Type.STRING,
                description: 'None | Metric mismatch | Population leap | Causal leap | Temporal overreach | Generalization leap | Magnitude inflation',
              },
              outcome: {
                type: Type.STRING,
                description: 'Supported | Overreach detected | Contradicted | Needs review | Unsupported',
              },
              explanation: { type: Type.STRING },
              missingEvidence: { type: Type.STRING },
              suggestedRevision: { type: Type.STRING },
              reviewerAction: {
                type: Type.STRING,
                description: 'Revise | Find evidence | Inspect source | Review manually | Approve',
              },
              highlightPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'id',
              'text',
              'claimType',
              'relevantPassageIds',
              'evidenceRelationship',
              'reasoningIssue',
              'outcome',
              'explanation',
              'missingEvidence',
              'suggestedRevision',
              'reviewerAction',
            ],
          },
        },
      },
    });

    let parsedClaims: any[];
    try {
      parsedClaims = JSON.parse(response.text || '[]');
    } catch {
      console.error('Failed to parse Gemini JSON output:', response.text);
      return res.status(422).json({
        error: 'The analysis response could not be validated. No evidence verdict was produced.',
      });
    }

    if (!Array.isArray(parsedClaims) || parsedClaims.length === 0) {
      return res.status(422).json({
        error: 'The analysis response could not be validated. No evidence verdict was produced.',
      });
    }

    // Step 2: Strict server-side validation & passage verification
    const validatedClaims: ClaimAnalysis[] = parsedClaims.map((rawClaim, idx) => {
      const fallbackId = `C-0${idx + 1}`;
      const { claim } = validateAndEnforceClaim(rawClaim, passageMap, fallbackId);
      return claim;
    });

    const stats = {
      totalClaims: validatedClaims.length,
      supported: validatedClaims.filter((c) => c.outcome === 'Supported').length,
      overreach: validatedClaims.filter((c) => c.outcome === 'Overreach detected').length,
      contradicted: validatedClaims.filter((c) => c.outcome === 'Contradicted').length,
      needsReview: validatedClaims.filter((c) => c.outcome === 'Needs review').length,
      unsupported: validatedClaims.filter((c) => c.outcome === 'Unsupported').length,
      evidenceCoverage: validatedClaims.filter((c) => c.relevantPassageIds.length > 0).length,
    };

    const result: AnalysisResult = {
      reportText,
      sources: validatedSources,
      passages,
      claims: validatedClaims,
      mode: 'live',
      modelUsed: 'gemini-3.1-flash-lite',
      timestamp: new Date().toISOString(),
      stats,
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error during live analysis:', error);
    // Never expose secrets, stack traces or provider internal errors
    res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }
});

// Compare Two Claims (Live Adversarial Twin Tool)
app.post('/api/evaluate-twin', async (req: Request, res: Response) => {
  if (!ai || !apiKey) {
    return res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }

  try {
    const { sourceText, claimA, claimB } = req.body;
    const rawSource = String(sourceText || '').trim();
    const textA = String(claimA || '').trim();
    const textB = String(claimB || '').trim();

    if (!rawSource || !textA || !textB) {
      return res.status(400).json({ error: 'sourceText, claimA, and claimB are all required.' });
    }

    // Decompose source into canonical passages
    const { passages, passageMap } = decomposeSources([
      {
        id: 'S1',
        label: 'Source',
        text: rawSource,
      },
    ]);

    const passagesSummary = passages
      .map((p) => `[${p.id}]: "${p.text}"`)
      .join('\n');

    const prompt = `You are ClaimCheck, an evidence integrity verification engine.
Compare and verify both claims against the provided canonical source passages:

CANONICAL SOURCE PASSAGES:
${passagesSummary}

CLAIM A: "${textA}"
CLAIM B: "${textB}"

INSTRUCTIONS:
1. For each claim, cite relevant passage IDs strictly from: [${passages.map((p) => p.id).join(', ')}]. If not supported, return [].
2. evidenceRelationship MUST be one of: "Supports" | "Contradicts" | "Partial support" | "No relevant evidence".
3. reasoningIssue MUST be one of: "None" | "Metric mismatch" | "Population leap" | "Causal leap" | "Temporal overreach" | "Generalization leap" | "Magnitude inflation".
4. outcome MUST be one of: "Supported" | "Overreach detected" | "Contradicted" | "Needs review" | "Unsupported".
5. Do NOT mark Supported just for matching numbers. If metrics differ (e.g. satisfaction vs academic performance), flag "Metric mismatch" and "Overreach detected".
6. Return valid JSON.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            twinA: {
              type: Type.OBJECT,
              properties: {
                relevantPassageIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                evidenceRelationship: { type: Type.STRING },
                reasoningIssue: { type: Type.STRING },
                outcome: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['relevantPassageIds', 'evidenceRelationship', 'reasoningIssue', 'outcome', 'explanation'],
            },
            twinB: {
              type: Type.OBJECT,
              properties: {
                relevantPassageIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                evidenceRelationship: { type: Type.STRING },
                reasoningIssue: { type: Type.STRING },
                outcome: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['relevantPassageIds', 'evidenceRelationship', 'reasoningIssue', 'outcome', 'explanation'],
            },
            reasoningDifference: {
              type: Type.STRING,
              description: 'Clear synthesis of the semantic/reasoning difference between the two claims.',
            },
          },
          required: ['twinA', 'twinB', 'reasoningDifference'],
        },
      },
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      console.error('Failed to parse Gemini evaluate-twin output');
      return res.status(422).json({
        error: 'The analysis response could not be validated. No evidence verdict was produced.',
      });
    }

    if (!parsed || !parsed.twinA || !parsed.twinB) {
      return res.status(422).json({
        error: 'The analysis response could not be validated. No evidence verdict was produced.',
      });
    }

    // Strict schema & passage validation on both twins
    const valA = validateAndEnforceClaim(
      { text: textA, ...parsed.twinA },
      passageMap,
      'Claim-A'
    );
    const valB = validateAndEnforceClaim(
      { text: textB, ...parsed.twinB },
      passageMap,
      'Claim-B'
    );

    // Retrieve exact verbatim passage text from the passage map
    const retrievedTextA = valA.claim.relevantPassageIds
      .map((id) => passageMap.get(id)?.text)
      .filter(Boolean)
      .join(' ');

    const retrievedTextB = valB.claim.relevantPassageIds
      .map((id) => passageMap.get(id)?.text)
      .filter(Boolean)
      .join(' ');

    res.json({
      mode: 'live',
      passages,
      twinA: {
        claim: textA,
        relevantPassageIds: valA.claim.relevantPassageIds,
        retrievedPassageText: retrievedTextA,
        evidenceRelationship: valA.claim.evidenceRelationship,
        reasoningIssue: valA.claim.reasoningIssue,
        outcome: valA.claim.outcome,
        explanation: valA.claim.explanation,
        isValid: valA.isValid,
      },
      twinB: {
        claim: textB,
        relevantPassageIds: valB.claim.relevantPassageIds,
        retrievedPassageText: retrievedTextB,
        evidenceRelationship: valB.claim.evidenceRelationship,
        reasoningIssue: valB.claim.reasoningIssue,
        outcome: valB.claim.outcome,
        explanation: valB.claim.explanation,
        isValid: valB.isValid,
      },
      reasoningDifference: parsed.reasoningDifference || 'No reasoning difference provided.',
    });
  } catch (err: any) {
    console.error('Error in evaluate-twin:', err);
    res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }
});

// Single Claim Live Verification Endpoint
app.post('/api/verify-single-claim', async (req: Request, res: Response) => {
  if (!ai || !apiKey) {
    return res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }

  try {
    const { claim, source } = req.body;
    if (!claim || !source) {
      return res.status(400).json({ error: 'claim and source are required' });
    }

    const { passages, passageMap } = decomposeSources([
      {
        id: 'S1',
        label: 'Source',
        text: source,
      },
    ]);

    const passagesSummary = passages
      .map((p) => `[${p.id}]: "${p.text}"`)
      .join('\n');

    const prompt = `You are ClaimCheck, an evidence integrity verification engine.
Verify this claim against the provided canonical source passages:

CANONICAL SOURCE PASSAGES:
${passagesSummary}

CLAIM TO VERIFY:
"${claim}"

INSTRUCTIONS:
1. Select relevant passage IDs ONLY from: [${passages.map((p) => p.id).join(', ')}]. If no passage is relevant, return [].
2. Classify evidenceRelationship strictly as: "Supports" | "Contradicts" | "Partial support" | "No relevant evidence".
3. Classify reasoningIssue strictly as: "None" | "Metric mismatch" | "Population leap" | "Causal leap" | "Temporal overreach" | "Generalization leap" | "Magnitude inflation".
4. Assign outcome strictly as: "Supported" | "Overreach detected" | "Contradicted" | "Needs review" | "Unsupported".
5. Do NOT mark Supported if numbers match but metrics differ (e.g. satisfaction vs academic performance, revenue vs marketing expense).
6. Return valid JSON.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevantPassageIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceRelationship: { type: Type.STRING },
            reasoningIssue: { type: Type.STRING },
            outcome: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ['relevantPassageIds', 'evidenceRelationship', 'reasoningIssue', 'outcome', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const { claim: validatedClaim, isValid } = validateAndEnforceClaim(
      { text: claim, ...parsed },
      passageMap,
      'C-LIVE'
    );

    const retrievedPassageText = validatedClaim.relevantPassageIds
      .map((id) => passageMap.get(id)?.text)
      .filter(Boolean)
      .join(' ');

    res.json({
      mode: 'live',
      claim,
      relevantPassageIds: validatedClaim.relevantPassageIds,
      retrievedPassageText,
      evidenceRelationship: validatedClaim.evidenceRelationship,
      reasoningIssue: validatedClaim.reasoningIssue,
      outcome: validatedClaim.outcome,
      explanation: validatedClaim.explanation,
      isValidSchema: isValid,
    });
  } catch (err: any) {
    console.error('Error in verify-single-claim:', err);
    res.status(503).json({
      error: 'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.',
    });
  }
});

// Start Express server and connect Vite in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ClaimCheck LIVE server listening on http://0.0.0.0:${port}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

