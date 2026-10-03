import React, { useEffect, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';
import { SourceDocument, SourcePassage } from '../types';

interface InspectSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceDocument[];
  passages: SourcePassage[];
  highlightPassageId?: string;
}

export const InspectSourceModal: React.FC<InspectSourceModalProps> = ({
  isOpen,
  onClose,
  sources,
  passages,
  highlightPassageId,
}) => {
  const highlightedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && highlightPassageId && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen, highlightPassageId]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspect-source-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs"
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#DDD8CE] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAE7DF] flex items-center justify-center text-[#143D30]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 id="inspect-source-title" className="text-sm font-bold text-[#15231D] font-serif">
                Source Context & Canonical Passages
              </h3>
              <p className="text-xs text-[#78716C]">
                Verbatim source documents segmented with deterministic passage identifiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close source inspector"
            className="text-[#78716C] hover:text-[#15231D] p-1.5 rounded-lg hover:bg-[#EFECE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="space-y-6">
            {sources.map((source, sIdx) => {
              const sourcePassages = passages.filter((p) => p.sourceId === (source.id || `S${sIdx + 1}`));
              return (
                <div
                  key={source.id || sIdx}
                  className="rounded-xl border border-[#DDD8CE] p-4 sm:p-5 bg-white space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-[#EFECE6] pb-2.5">
                    <span className="font-bold text-xs text-[#15231D]">
                      {source.label || `Source ${sIdx + 1}`}
                    </span>
                    <span className="font-mono text-xs text-[#78716C]">
                      {source.id} · {sourcePassages.length} passages
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sourcePassages.map((p) => {
                      const isHighlighted = p.id === highlightPassageId;
                      return (
                        <div
                          key={p.id}
                          ref={isHighlighted ? highlightedRef : null}
                          tabIndex={isHighlighted ? 0 : undefined}
                          className={`p-3.5 rounded-lg text-xs font-mono leading-relaxed transition-all ${
                            isHighlighted
                              ? 'bg-[#FEF9C3] border-2 border-[#EAB308] text-[#713F12] shadow-xs ring-2 ring-[#FEF08A]'
                              : 'bg-[#FAF8F5] border border-[#DDD8CE] text-[#292524]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-[#143D30]">
                              PASSAGE {p.id}
                            </span>
                            {isHighlighted && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] bg-[#FEF08A] px-2 py-0.5 rounded">
                                Cited Evidence Excerpt
                              </span>
                            )}
                          </div>
                          <p className="select-text">"{p.text}"</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DDD8CE] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#143D30] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5242] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
