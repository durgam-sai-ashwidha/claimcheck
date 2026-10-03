import { GoogleGenAI, Type } from '@google/genai';
import {
  ClaimAnalysis,
  ClaimOutcome,
  EvidenceRelationship,
  ReasoningIssue,
  SourceDocument,
  SourcePassage,
} from './types.ts';

/**
 * Split source documents into canonical passages with stable IDs (e.g. S1-P1, S1-P2)
 */
export function decomposeSources(sources: SourceDocument[]): {
  passages: SourcePassage[];
  passageMap: Map<string, SourcePassage>;
} {
  const passages: SourcePassage[] = [];
  const passageMap = new Map<string, SourcePassage>();

  sources.forEach((source, sIdx) => {
    const sId = source.id || `S${sIdx + 1}`;
    const sLabel = source.label || `Source ${sIdx + 1}`;

    // Split sentences cleanly while preserving original text
    const rawSentences = source.text
      .replace(/\r\n/g, '\n')
      .split(/(?<=[.!?])\s+|\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    rawSentences.forEach((sentence, pIdx) => {
      const pId = `${sId}-P${pIdx + 1}`;
      const passage: SourcePassage = {
        id: pId,
        sourceId: sId,
        sourceLabel: sLabel,
        passageIndex: pIdx + 1,
        text: sentence,
      };
      passages.push(passage);
      passageMap.set(pId, passage);
    });
  });

  return { passages, passageMap };
}

/**
 * Strict server-side schema and passage validator
 */
export function validateAndEnforceClaim(
  rawClaim: any,
  passageMap: Map<string, SourcePassage>,
  fallbackId: string
): {
  claim: ClaimAnalysis;
  isValid: boolean;
  validationNotes: string[];
} {
  const validationNotes: string[] = [];
  let isValid = true;

  // 1. Validate required fields existence
  const requiredFields = [
    'text',
    'evidenceRelationship',
    'reasoningIssue',
    'outcome',
    'explanation',
  ];

  for (const field of requiredFields) {
    if (!rawClaim || rawClaim[field] === undefined || rawClaim[field] === null || String(rawClaim[field]).trim() === '') {
      validationNotes.push(`Missing required field: ${field}`);
      isValid = false;
    }
  }

  // 2. Validate enums
  const validRelationships: EvidenceRelationship[] = [
    'Supports',
    'Contradicts',
    'Partial support',
    'No relevant evidence',
  ];
  const validIssues: ReasoningIssue[] = [
    'None',
    'Metric mismatch',
    'Population leap',
    'Causal leap',
    'Temporal overreach',
    'Generalization leap',
    'Magnitude inflation',
  ];
  const validOutcomes: ClaimOutcome[] = [
    'Supported',
    'Overreach detected',
    'Contradicted',
    'Needs review',
    'Unsupported',
  ];

  let rel: EvidenceRelationship = validRelationships.includes(rawClaim?.evidenceRelationship)
    ? rawClaim.evidenceRelationship
    : 'No relevant evidence';

  let issue: ReasoningIssue = validIssues.includes(rawClaim?.reasoningIssue)
    ? rawClaim.reasoningIssue
    : 'None';

  let outcome: ClaimOutcome = validOutcomes.includes(rawClaim?.outcome)
    ? rawClaim.outcome
    : 'Needs review';

  if (!validRelationships.includes(rawClaim?.evidenceRelationship)) {
    validationNotes.push(`Invalid evidenceRelationship: "${rawClaim?.evidenceRelationship}"`);
    isValid = false;
  }
  if (!validIssues.includes(rawClaim?.reasoningIssue)) {
    validationNotes.push(`Invalid reasoningIssue: "${rawClaim?.reasoningIssue}"`);
    isValid = false;
  }
  if (!validOutcomes.includes(rawClaim?.outcome)) {
    validationNotes.push(`Invalid outcome: "${rawClaim?.outcome}"`);
    isValid = false;
  }

  // 3. Strict Passage ID Validation: Every passage ID must exist in the source map!
  const rawPassageIds: string[] = Array.isArray(rawClaim?.relevantPassageIds)
    ? rawClaim.relevantPassageIds
    : [];

  const validPassageIds: string[] = [];
  const rejectedPassageIds: string[] = [];

  for (const pid of rawPassageIds) {
    if (passageMap.has(pid)) {
      validPassageIds.push(pid);
    } else {
      rejectedPassageIds.push(pid);
      isValid = false;
    }
  }

  if (rejectedPassageIds.length > 0) {
    validationNotes.push(`Rejected invalid passage ID(s): [${rejectedPassageIds.join(', ')}]`);
  }

  // If all passage IDs were rejected or none exist
  if (validPassageIds.length === 0) {
    if (rel === 'Supports' || rel === 'Partial support') {
      validationNotes.push(
        `Claim claimed relationship "${rel}" but no valid passage IDs exist. Reclassified to Unsupported/No relevant evidence.`
      );
      rel = 'No relevant evidence';
      outcome = 'Unsupported';
    }
  }

  // 4. Evidence Integrity Invariants:
  // A claim cannot be "Supported" if relationship is Partial support, Contradicts, or No relevant evidence,
  // or if a reasoning issue is present (Metric mismatch, Population leap, Causal leap, etc.)
  if (outcome === 'Supported') {
    if (rel === 'Contradicts') {
      validationNotes.push('Outcome was Supported despite contradictory evidence. Enforced to Contradicted.');
      outcome = 'Contradicted';
    } else if (rel === 'No relevant evidence') {
      validationNotes.push('Outcome was Supported despite no relevant evidence. Enforced to Unsupported.');
      outcome = 'Unsupported';
    } else if (rel === 'Partial support') {
      validationNotes.push('Outcome was Supported despite only Partial support. Enforced to Overreach detected.');
      outcome = 'Overreach detected';
      if (issue === 'None') {
        issue = 'Generalization leap';
      }
    } else if (issue !== 'None') {
      validationNotes.push(`Outcome was Supported despite reasoning issue "${issue}". Enforced to Overreach detected.`);
      outcome = 'Overreach detected';
    }
  }

  // If a reasoning issue like Metric mismatch or Population leap is identified, outcome cannot be Supported
  if (issue !== 'None' && outcome === 'Supported') {
    outcome = 'Overreach detected';
  }

  // Ensure outcome, relationship, and reasoning issue remain separate fields
  const explanation = rawClaim?.explanation
    ? String(rawClaim.explanation)
    : 'No explanation provided.';

  const fullExplanation =
    validationNotes.length > 0
      ? `[Schema Validation: ${validationNotes.join('; ')}] ${explanation}`
      : explanation;

  const claim: ClaimAnalysis = {
    id: rawClaim?.id || fallbackId,
    text: String(rawClaim?.text || 'Unspecified claim').trim(),
    claimType: rawClaim?.claimType || 'Factual',
    relevantPassageIds: validPassageIds,
    evidenceRelationship: rel,
    reasoningIssue: issue,
    outcome: outcome,
    explanation: fullExplanation,
    missingEvidence: String(rawClaim?.missingEvidence || 'None'),
    suggestedRevision: String(rawClaim?.suggestedRevision || rawClaim?.text || ''),
    reviewerAction: rawClaim?.reviewerAction || 'Review manually',
    highlightPhrases: Array.isArray(rawClaim?.highlightPhrases) ? rawClaim.highlightPhrases : [],
  };

  return { claim, isValid, validationNotes };
}

/**
 * Call Gemini with exponential backoff retry for transient 503 / 429
 */
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: any,
  maxRetries = 4
): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('Quota exceeded');

      const isTransient =
        isRateLimit ||
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand');

      if (isTransient && attempt < maxRetries) {
        let delayMs = attempt * 2000;
        if (isRateLimit) {
          // Check if error specified exact wait time, e.g. "Please retry in 40.02s"
          const match = err?.message?.match(/retry in ([\d\.]+)s/i);
          const parsedSec = match ? parseFloat(match[1]) : 20;
          delayMs = Math.ceil(parsedSec * 1000) + 1500;
          console.warn(`Gemini 429 rate limit encountered (5 RPM Free Tier). Waiting ${Math.round(delayMs / 1000)}s for quota window to reset (Attempt ${attempt}/${maxRetries})...`);
        } else {
          console.warn(`Gemini API transient issue (${err?.message || err?.status}). Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
}
