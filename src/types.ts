export type EvidenceRelationship =
  | 'Supports'
  | 'Contradicts'
  | 'Partial support'
  | 'No relevant evidence';

export type ReasoningIssue =
  | 'None'
  | 'Metric mismatch'
  | 'Population leap'
  | 'Causal leap'
  | 'Temporal overreach'
  | 'Generalization leap'
  | 'Magnitude inflation';

export type ClaimOutcome =
  | 'Supported'
  | 'Overreach detected'
  | 'Contradicted'
  | 'Needs review'
  | 'Unsupported';

export type ReviewerAction =
  | 'Revise'
  | 'Find evidence'
  | 'Inspect source'
  | 'Review manually'
  | 'Approve';

export interface SourcePassage {
  id: string; // e.g. "S1-P1"
  sourceId: string; // e.g. "S1"
  sourceLabel: string;
  passageIndex: number;
  text: string;
}

export interface SourceDocument {
  id: string; // e.g. "S1"
  label: string;
  text: string;
  passages?: SourcePassage[];
}

export interface ClaimAnalysis {
  id: string; // e.g. "C-01"
  text: string;
  claimType: 'Factual' | 'Causal' | 'Generalization' | 'Predictive' | 'Comparative';
  relevantPassageIds: string[];
  evidenceRelationship: EvidenceRelationship;
  reasoningIssue: ReasoningIssue;
  outcome: ClaimOutcome;
  explanation: string;
  missingEvidence: string;
  suggestedRevision: string;
  reviewerAction: ReviewerAction;
  highlightPhrases?: string[];
}

export interface AnalysisResult {
  reportText: string;
  sources: SourceDocument[];
  passages: SourcePassage[];
  claims: ClaimAnalysis[];
  mode: 'live';
  modelUsed: string;
  timestamp: string;
  stats: {
    totalClaims: number;
    supported: number;
    overreach: number;
    contradicted: number;
    needsReview: number;
    unsupported: number;
    evidenceCoverage: number;
  };
}
