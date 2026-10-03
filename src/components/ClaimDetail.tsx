import React from 'react';
import {
  FileText,
  UserCheck,
  Edit3,
  Search,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { ClaimAnalysis, SourcePassage } from '../types';

interface ClaimDetailProps {
  claim: ClaimAnalysis;
  passages: SourcePassage[];
  isHumanReviewRequested?: boolean;
  onOpenRevise: (claim: ClaimAnalysis) => void;
  onOpenFindEvidence: (claim: ClaimAnalysis) => void;
  onOpenInspectSource: (passageId?: string) => void;
  onOpenManualReview: (claim: ClaimAnalysis) => void;
  actionFeedback?: string | null;
}

export const ClaimDetail: React.FC<ClaimDetailProps> = ({
  claim,
  passages,
  isHumanReviewRequested = false,
  onOpenRevise,
  onOpenFindEvidence,
  onOpenInspectSource,
  onOpenManualReview,
  actionFeedback,
}) => {
  const referencedPassages = passages.filter((p) =>
    claim.relevantPassageIds.includes(p.id)
  );

  const primaryPassage = referencedPassages[0] || null;

  const isSupportedNoIssues =
    claim.outcome === 'Supported' &&
    (claim.reasoningIssue === 'None' || !claim.reasoningIssue) &&
    (!claim.missingEvidence ||
      claim.missingEvidence.trim().toLowerCase() === 'none' ||
      claim.missingEvidence.trim().toLowerCase() === 'none.' ||
      claim.missingEvidence.trim().toLowerCase() === 'none specified.');

  const renderHighlightedText = (text: string, highlights: string[] = []) => {
    if (!highlights || highlights.length === 0) return text;
    try {
      const escaped = highlights
        .filter((h) => h.trim().length > 1)
        .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (escaped.length === 0) return text;
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        const isMatch = highlights.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-[#FEF08A] text-[#15231D] px-1 py-0.5 rounded font-medium"
          >
            {part}
          </mark>
        ) : (
          part
        );
      });
    } catch {
      return text;
    }
  };

  const getOutcomePill = () => {
    switch (claim.outcome) {
      case 'Supported':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#D7EED9] text-[#1E6B35]">
            SUPPORTED
          </span>
        );
      case 'Overreach detected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#FDD9C2] text-[#A84315]">
            OVERREACH DETECTED
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#FCD8D8] text-[#B82B2B]">
            CONTRADICTED
          </span>
        );
      case 'Needs review':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#F9E6B3] text-[#8C600B]">
            NEEDS REVIEW
          </span>
        );
      case 'Unsupported':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1]">
            UNSUPPORTED BY SUPPLIED SOURCES
          </span>
        );
    }
  };

  const getRelationshipPill = () => {
    switch (claim.evidenceRelationship) {
      case 'Supports':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D7EED9] text-[#1E6B35]">
            SUPPORTS
          </span>
        );
      case 'Partial support':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F9E29D] text-[#78450F]">
            PARTIAL SUPPORT
          </span>
        );
      case 'Contradicts':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCD8D8] text-[#B82B2B]">
            CONTRADICTS
          </span>
        );
      case 'No relevant evidence':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2E8F0] text-[#334155]">
            NO RELEVANT EVIDENCE
          </span>
        );
    }
  };

  // Compute clean suggested grounded revision
  let displayRevision = (claim.suggestedRevision || '').replace(/^["']|["']$/g, '').trim();

  if (claim.outcome === 'Supported' || isSupportedNoIssues) {
    displayRevision = 'No revision required. This claim is fully supported by the cited source passage.';
  } else if (claim.outcome === 'Needs review') {
    if (!displayRevision || displayRevision.toLowerCase() === 'none' || displayRevision.toLowerCase().includes('check the source')) {
      displayRevision = 'A human reviewer should determine whether additional evidence resolves the ambiguity.';
    }
  } else if (claim.outcome === 'Unsupported') {
    if (!displayRevision || displayRevision.toLowerCase() === 'none' || displayRevision.toLowerCase().includes('verify the claim')) {
      const missing = claim.missingEvidence && claim.missingEvidence.toLowerCase() !== 'none'
        ? claim.missingEvidence.trim().replace(/\.$/, '')
        : 'the claimed outcome';
      displayRevision = `Remove this claim or provide a source that directly measures or establishes ${missing}.`;
    }
  } else if (claim.outcome === 'Overreach detected') {
    if (!displayRevision || displayRevision.toLowerCase() === 'none') {
      displayRevision = claim.sourceEstablishes || 'Rewrite this claim so it states only what is established by the cited evidence.';
    }
  }

  return (
    <div
      role="region"
      aria-label={`Claim Detail: ${claim.id}`}
      className="p-6 lg:p-8 space-y-6 bg-[#FAF8F5] overflow-y-auto"
    >
      {/* Action feedback toast */}
      {actionFeedback && (
        <div
          role="status"
          className="p-3 rounded-xl bg-[#E7EFE6] border border-[#B7CEB5] text-[#143D30] text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
        >
          <ShieldCheck className="w-4 h-4 text-[#1E6B35] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. Claim Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-[#57534E] block">
            {claim.id} / CLAIM
          </span>
          {isHumanReviewRequested && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>HUMAN REVIEW REQUESTED (CURRENT SESSION)</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#15231D] tracking-tight leading-snug">
          {claim.text}
        </h1>
      </div>

      {/* 2. Verdict, 3. Evidence Relationship, 4. Reasoning Issue, 5. Source Passage ID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
        {/* 2. Verdict */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Verdict
          </span>
          <div>{getOutcomePill()}</div>
        </div>

        {/* 3. Evidence Relationship */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Evidence Relationship
          </span>
          <div>{getRelationshipPill()}</div>
        </div>

        {/* 4. Reasoning Issue */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Reasoning Issue
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              claim.reasoningIssue !== 'None'
                ? 'bg-[#FDD9C2] text-[#A84315]'
                : 'bg-[#D7EED9] text-[#1E6B35]'
            }`}
          >
            {claim.reasoningIssue.toUpperCase()}
          </span>
        </div>

        {/* 5. Source Passage ID */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Source Passage ID
          </span>
          <span className="font-mono text-xs font-bold text-[#15231D] px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD8CE] rounded-lg inline-block">
            {claim.relevantPassageIds.length > 0
              ? claim.relevantPassageIds.join(', ')
              : 'None'}
          </span>
        </div>
      </div>

      {/* 6. Exact Source Excerpt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-bold text-[#57534E] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#143D30]" />
            <span>Exact Source Excerpt</span>
            {primaryPassage && (
              <span className="font-mono text-[11px] text-[#78716C]">
                ({primaryPassage.id})
              </span>
            )}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DDD8CE] text-sm text-[#15231D] font-mono leading-relaxed shadow-2xs">
          {primaryPassage ? (
            renderHighlightedText(
              primaryPassage.text,
              claim.highlightPhrases && claim.highlightPhrases.length > 0
                ? claim.highlightPhrases
                : []
            )
          ) : (
            <span className="text-xs text-[#78716C] italic font-sans">
              No passage in the supplied sources establishes this full claim.
            </span>
          )}
        </div>
      </div>

      {/* 7. What the Source Establishes & 8. What the Claim Adds or Changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 7. What the Source Establishes */}
        <div className="p-4 rounded-xl bg-white border border-[#DDD8CE] space-y-2 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#143D30] tracking-wider block">
            WHAT THE SOURCE ESTABLISHES
          </span>
          <p className="text-xs sm:text-sm text-[#15231D] leading-relaxed">
            {claim.sourceEstablishes ||
              (primaryPassage
                ? primaryPassage.text
                : 'The supplied sources do not establish this outcome.')}
          </p>
        </div>

        {/* 8. What the Claim Adds or Changes */}
        <div className="p-4 rounded-xl bg-white border border-[#DDD8CE] space-y-2 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#C2410C] tracking-wider block">
            WHAT THE CLAIM ADDS OR CHANGES
          </span>
          <p className="text-xs sm:text-sm text-[#15231D] leading-relaxed">
            {claim.claimAddsOrChanges ||
              (claim.outcome === 'Supported'
                ? 'None. The claim accurately reflects the source.'
                : `Substitutes or expands with ${claim.reasoningIssue.toLowerCase()} without empirical evidence.`)}
          </p>
        </div>
      </div>

      {/* Explanation summary */}
      {claim.explanation && (
        <div className="p-3.5 rounded-xl bg-[#F4F1EA] border border-[#DDD8CE] text-xs text-[#44403C] leading-relaxed">
          <span className="font-bold text-[#15231D] block mb-1 uppercase text-[10px] tracking-wider">
            Evidence Explanation
          </span>
          {claim.explanation}
        </div>
      )}

      {/* 9. Suggested Grounded Revision */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-[#78716C] block">
          SUGGESTED GROUNDED REVISION
        </span>
        <div className="p-4 rounded-xl bg-[#EAE8E2] border border-[#DDD8CE] text-xs sm:text-sm font-serif text-[#15231D] leading-relaxed">
          {displayRevision}
        </div>
      </div>

      {/* 10. Reviewer Actions */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-[#78716C] block">
          REVIEWER ACTIONS
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenRevise(claim)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#143D30] hover:bg-[#1E5242] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Revise</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFindEvidence(claim)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F4F1EA] border border-[#DDD8CE] text-[#292524] text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          >
            <Search className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Find evidence</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInspectSource(primaryPassage?.id)}
            disabled={!primaryPassage}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F4F1EA] border border-[#DDD8CE] text-[#292524] text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Inspect source</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenManualReview(claim)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F4F1EA] border border-[#DDD8CE] text-[#292524] text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#57534E]" />
            <span>{isHumanReviewRequested ? 'Update manual review' : 'Review manually'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
