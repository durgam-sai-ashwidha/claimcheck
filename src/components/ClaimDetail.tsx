import React from 'react';
import {
  ArrowRight,
  FileText,
  AlertTriangle,
  UserCheck,
  Edit3,
  Search,
  BookOpen,
  User,
  ShieldCheck,
  HelpCircle,
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
  const isUnsupported =
    claim.outcome === 'Unsupported' ||
    claim.evidenceRelationship === 'No relevant evidence' ||
    referencedPassages.length === 0;

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
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#D7EED9] text-[#1E6B35]">
            SUPPORTED
          </span>
        );
      case 'Overreach detected':
        return (
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#FDD9C2] text-[#A84315]">
            OVERREACH DETECTED
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#FCD8D8] text-[#B82B2B]">
            CONTRADICTED
          </span>
        );
      case 'Needs review':
        return (
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#F9E6B3] text-[#8C600B]">
            NEEDS REVIEW
          </span>
        );
      case 'Unsupported':
      default:
        return (
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1]">
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

  return (
    <div
      role="region"
      aria-label={`Claim Detail: ${claim.id}`}
      className="p-6 lg:p-8 space-y-7 bg-[#FAF8F5] overflow-y-auto"
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

      {/* Title & Outcome Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-[#57534E] block">
            {claim.id} / CLAIM DETAIL
          </span>
          {isHumanReviewRequested && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>HUMAN REVIEW REQUESTED (CURRENT SESSION)</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#15231D] tracking-tight leading-snug">
          {claim.text}
        </h1>

        <div>{getOutcomePill()}</div>
      </div>

      {/* Visual Pipeline Flow (Claim -> Source -> Reasoning Issue -> Review Action) */}
      <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#DDD8CE]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Step 1: Claim */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#143D30]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                CLAIM
              </span>
              <span className="font-semibold text-[#15231D] truncate block">
                {claim.id}
              </span>
            </div>
          </div>

          <ArrowRight className="hidden sm:block w-4 h-4 text-[#A8A29E] shrink-0" />

          {/* Step 2: Source */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#143D30]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                SOURCE
              </span>
              <span className="font-semibold text-[#15231D] truncate block font-mono">
                {claim.relevantPassageIds.length > 0 ? claim.relevantPassageIds.join(', ') : 'None'}
              </span>
            </div>
          </div>

          <ArrowRight className="hidden sm:block w-4 h-4 text-[#A8A29E] shrink-0" />

          {/* Step 3: Reasoning Issue */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] flex items-center justify-center shrink-0">
              <AlertTriangle
                className={`w-4 h-4 ${
                  claim.reasoningIssue !== 'None' ? 'text-[#C2410C]' : 'text-[#16A34A]'
                }`}
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#C2410C] block">
                {claim.reasoningIssue.toUpperCase()}
              </span>
              <span className="text-[11px] text-[#78716C] truncate block">
                (reasoning issue)
              </span>
            </div>
          </div>

          <ArrowRight className="hidden sm:block w-4 h-4 text-[#A8A29E] shrink-0" />

          {/* Step 4: Review Action */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#143D30]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                REVIEW ACTION
              </span>
              <span className="text-[11px] text-[#57534E] truncate block">
                {isHumanReviewRequested ? 'In Human Review' : claim.reviewerAction || 'Review manually'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Evidence Chain */}
      <div className="space-y-3">
        <h2 className="text-xl font-serif font-bold text-[#15231D]">Evidence chain</h2>

        {/* REQUIREMENT 8: NO EVIDENCE IS A VALID RESULT */}
        {isUnsupported ? (
          <div className="p-6 rounded-xl bg-white border border-[#DDD8CE] space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-[#E2E8F0] text-[#334155]">
                Unsupported by supplied sources
              </span>
              <span className="text-xs text-[#78716C] font-mono">Analytical Finding</span>
            </div>
            <p className="text-base text-[#15231D] font-medium leading-relaxed">
              No passage in the supplied sources establishes this full claim.
            </p>
            <p className="text-xs text-[#57534E] leading-relaxed">
              {claim.explanation ||
                'This claim was evaluated against all supplied source passages. None of the passages contain corroborating factual evidence or empirical metrics to substantiate it.'}
            </p>
            <div className="pt-2 text-xs text-[#78716C] border-t border-[#EFECE6] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#57534E]" />
              <span>This is an evidence integrity result, not a system failure.</span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#F4F1EA] border border-[#DDD8CE] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left Quote Box */}
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#143D30]" />
                  <span className="font-bold text-xs text-[#15231D]">
                    {primaryPassage?.sourceLabel || 'Source Document'}
                  </span>
                  {primaryPassage && (
                    <span className="text-xs font-mono text-[#78716C]">
                      {primaryPassage.id}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-white border border-[#DDD8CE] text-sm text-[#15231D] font-mono leading-relaxed shadow-2xs">
                  {primaryPassage ? (
                    renderHighlightedText(
                      primaryPassage.text,
                      claim.highlightPhrases && claim.highlightPhrases.length > 0
                        ? claim.highlightPhrases
                        : []
                    )
                  ) : (
                    <span className="text-xs text-[#78716C] italic font-sans">
                      No passage citation available.
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#78716C]">
                  {primaryPassage
                    ? `Exact excerpt from source (${primaryPassage.id})`
                    : 'No passage citation available'}
                </p>
              </div>

              {/* Right Assessment Details */}
              <div className="w-full lg:w-72 space-y-4 text-xs shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block mb-1">
                    EVIDENCE RELATIONSHIP
                  </span>
                  {getRelationshipPill()}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block mb-1">
                    REASONING ISSUE
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDD9C2] text-[#A84315]">
                    {claim.reasoningIssue.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#44403C] leading-relaxed pt-1">
                  {claim.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section: Claim Analysis */}
      <div className="space-y-3">
        <h2 className="text-xl font-serif font-bold text-[#15231D]">Claim analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Claim Type */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              CLAIM TYPE
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EAE8E2] text-[#292524]">
              {claim.claimType}
            </span>
          </div>

          {/* Missing Evidence */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              MISSING EVIDENCE
            </span>
            <p className="text-xs text-[#44403C] leading-relaxed">
              {claim.missingEvidence || 'None specified.'}
            </p>
          </div>

          {/* Suggested Revision */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              SUGGESTED REVISION
            </span>
            <div className="p-3.5 rounded-lg bg-[#EAE8E2] border border-[#DDD8CE] text-xs font-serif italic text-[#292524] leading-relaxed">
              "{claim.suggestedRevision || claim.text}"
            </div>
          </div>
        </div>
      </div>

      {/* Section: Reviewer Action */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-[#78716C] block">
          REVIEWER ACTION
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
