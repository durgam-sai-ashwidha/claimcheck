import React from 'react';
import { ChevronRight, UserCheck } from 'lucide-react';
import { ClaimAnalysis, ClaimOutcome } from '../types';

interface ClaimsListProps {
  claims: ClaimAnalysis[];
  selectedClaimId: string;
  onSelectClaim: (id: string) => void;
  humanReviewClaimIds?: Set<string>;
}

export const ClaimsList: React.FC<ClaimsListProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim,
  humanReviewClaimIds,
}) => {
  const getOutcomeBadge = (outcome: ClaimOutcome) => {
    switch (outcome) {
      case 'Supported':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#D7EED9] text-[#1E6B35]">
            SUPPORTED
          </span>
        );
      case 'Overreach detected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#FDDCC7] text-[#A84315]">
            OVERREACH
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#FCD8D8] text-[#B82B2B]">
            CONTRADICTED
          </span>
        );
      case 'Needs review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#F9E6B3] text-[#8C600B]">
            NEEDS REVIEW
          </span>
        );
      case 'Unsupported':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-[#E2E8F0] text-[#334155]">
            UNSUPPORTED
          </span>
        );
    }
  };

  return (
    <div
      role="region"
      aria-label="Extracted Claims List"
      className="bg-[#F3EFE8] border-r border-[#DDD8CE] flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#DDD8CE] flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-[#57534E]">
          REPORT / {String(claims.length).padStart(2, '0')} CLAIMS
        </span>
        <span className="text-[11px] font-mono text-[#78716C]">
          Verified Live
        </span>
      </div>

      {/* Claims List */}
      <div className="p-3 space-y-2 overflow-y-auto" role="list">
        {claims.map((claim) => {
          const isSelected = claim.id === selectedClaimId;
          const isHumanReviewRequested = humanReviewClaimIds?.has(claim.id);
          return (
            <button
              key={claim.id}
              role="listitem"
              aria-selected={isSelected}
              onClick={() => onSelectClaim(claim.id)}
              className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between gap-3 border shadow-2xs group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none ${
                isSelected
                  ? 'bg-[#E7EFE6] border-[#B7CEB5] border-l-4 border-l-[#143D30]'
                  : 'bg-[#FAF8F5] hover:bg-white border-[#DDD8CE] border-l-4 border-l-transparent'
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#15231D]">
                    {claim.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getOutcomeBadge(claim.outcome)}
                    {isHumanReviewRequested && (
                      <span
                        title="Manual review requested in this session"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>REVIEW</span>
                      </span>
                    )}
                  </div>
                </div>
                <p
                  className={`text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-[#15231D] font-medium' : 'text-[#44403C]'
                  }`}
                >
                  {claim.text}
                </p>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isSelected
                    ? 'text-[#143D30] translate-x-0.5'
                    : 'text-[#A8A29E] group-hover:text-[#57534E]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
