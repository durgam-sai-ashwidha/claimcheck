import React from 'react';
import { X, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { ClaimAnalysis } from '../types';

interface FindEvidenceModalProps {
  claim: ClaimAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FindEvidenceModal: React.FC<FindEvidenceModalProps> = ({
  claim,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !claim) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-evidence-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs"
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#DDD8CE] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAE7DF] flex items-center justify-center text-[#143D30]">
              <Search className="w-4 h-4 text-[#143D30]" />
            </div>
            <h3 id="find-evidence-title" className="text-sm font-bold text-[#15231D] font-serif">
              Evidence Retrieval Guidance ({claim.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence guidance modal"
            className="text-[#78716C] hover:text-[#15231D] p-1.5 rounded-lg hover:bg-[#EFECE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#78716C]">
              TARGET CLAIM:
            </span>
            <p className="text-base font-serif font-semibold text-[#15231D]">
              "{claim.text}"
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] space-y-1.5 text-xs">
            <span className="font-bold text-[#C2410C] block uppercase tracking-wider text-[11px]">
              MISSING EMPIRICAL PROOF:
            </span>
            <p className="text-[#334155] leading-relaxed text-sm">
              {claim.missingEvidence ||
                'To substantiate this claim without overreach, provide explicit empirical metrics from primary sources.'}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              RECOMMENDED RESEARCH CRITERIA:
            </span>
            <ul className="text-xs sm:text-sm text-[#475569] space-y-2 list-disc list-inside leading-relaxed">
              <li>Look for randomized controlled trials or cohort studies measuring the exact stated metric.</li>
              <li>Verify that sample populations represent the target demographic groups without extrapolating.</li>
              <li>Avoid relying on subjective satisfaction surveys when claiming objective performance changes.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-[#DDD8CE] bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#143D30] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5242] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            Acknowledge Guidance
          </button>
        </div>
      </div>
    </div>
  );
};
