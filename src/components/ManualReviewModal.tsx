import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { ClaimAnalysis, ClaimOutcome } from '../types';

interface ManualReviewModalProps {
  claim: ClaimAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOutcome: (claimId: string, outcome: ClaimOutcome, note: string) => void;
}

export const ManualReviewModal: React.FC<ManualReviewModalProps> = ({
  claim,
  isOpen,
  onClose,
  onUpdateOutcome,
}) => {
  if (!isOpen || !claim) return null;

  const [selectedOutcome, setSelectedOutcome] = useState<ClaimOutcome>(claim.outcome);
  const [auditorNote, setAuditorNote] = useState('');

  const outcomes: ClaimOutcome[] = [
    'Supported',
    'Overreach detected',
    'Contradicted',
    'Needs review',
    'Unsupported',
  ];

  const handleSave = () => {
    onUpdateOutcome(claim.id, selectedOutcome, auditorNote);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs"
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#DDD8CE] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#6D28D9]">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 id="manual-review-title" className="text-sm font-bold text-[#15231D] font-serif">
              Manual Human Review ({claim.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close manual review modal"
            className="text-[#78716C] hover:text-[#15231D] p-1.5 rounded-lg hover:bg-[#EFECE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">
              TARGET CLAIM:
            </span>
            <p className="text-sm font-serif font-semibold text-[#15231D]">
              "{claim.text}"
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="select-outcome" className="text-xs font-semibold text-[#15231D] block">
              Set Verified Outcome:
            </label>
            <select
              id="select-outcome"
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value as ClaimOutcome)}
              className="w-full text-sm p-3 rounded-lg border border-[#DDD8CE] bg-white text-[#15231D] focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
            >
              {outcomes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auditor-note-input" className="text-xs font-semibold text-[#15231D] block">
              Auditor Verification Note:
            </label>
            <textarea
              id="auditor-note-input"
              rows={3}
              value={auditorNote}
              onChange={(e) => setAuditorNote(e.target.value)}
              placeholder="Record reasoning or documentation note for this session..."
              className="w-full text-base p-3 rounded-lg border border-[#DDD8CE] bg-white text-[#15231D] placeholder:text-[#A8A29E] focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
            />
          </div>

          <p className="text-xs text-[#78716C] bg-white p-3 rounded-lg border border-[#DDD8CE]">
            Saving this will mark the claim as human-reviewed in the current session.
          </p>
        </div>

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
            onClick={handleSave}
            className="px-5 py-2 bg-[#143D30] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5242] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            Save Verification
          </button>
        </div>
      </div>
    </div>
  );
};
