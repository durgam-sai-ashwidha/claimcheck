import React, { useState } from 'react';
import { X, Edit3, Copy, Check, Sparkles } from 'lucide-react';
import { ClaimAnalysis } from '../types';

interface ReviseClaimModalProps {
  claim: ClaimAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyRevision: (claimId: string, revisedText: string) => void;
}

export const ReviseClaimModal: React.FC<ReviseClaimModalProps> = ({
  claim,
  isOpen,
  onClose,
  onApplyRevision,
}) => {
  if (!isOpen || !claim) return null;

  const [customText, setCustomText] = useState(claim.suggestedRevision || claim.text);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyRevision(claim.id, customText);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revise-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs"
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#DDD8CE] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAE7DF] flex items-center justify-center text-[#143D30]">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 id="revise-modal-title" className="text-sm font-bold text-[#15231D] font-serif">
              Revise Claim ({claim.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close revision modal"
            className="text-[#78716C] hover:text-[#15231D] p-1.5 rounded-lg hover:bg-[#EFECE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Preserved Original Claim */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              ORIGINAL REPORT CLAIM (PRESERVED):
            </span>
            <p className="p-3.5 rounded-xl bg-white border border-[#DDD8CE] text-sm text-[#15231D] font-serif italic">
              "{claim.text}"
            </p>
          </div>

          {/* Separated Suggested / Grounded Revision */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#143D30] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1E6B35]" />
                <span>GROUNDED REVISION (SEPARATE FIELD):</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[#143D30] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#1E6B35]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy revision'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-base p-4 rounded-xl border border-[#DDD8CE] bg-white text-[#15231D] font-serif leading-relaxed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
            />
            <p className="text-xs text-[#78716C]">
              This grounded revision adjusts the assertion to stay strictly within what source passages substantiate.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDD8CE] bg-white flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#DDD8CE] text-[#57534E] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-[#143D30] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5242] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] cursor-pointer"
          >
            Apply Grounded Revision
          </button>
        </div>
      </div>
    </div>
  );
};
