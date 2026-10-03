import React from 'react';
import {
  Play,
  Plus,
  Trash2,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  WifiOff,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SourceDocument } from '../types';

interface InputSectionProps {
  reportText: string;
  setReportText: (val: string) => void;
  sources: SourceDocument[];
  setSources: React.Dispatch<React.SetStateAction<SourceDocument[]>>;
  onAnalyze: () => void;
  onCancel?: () => void;
  isLoading: boolean;
  loadingStage?: string;
  isSlow?: boolean;
  errorMessage?: string | null;
  isOffline?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  reportText,
  setReportText,
  sources,
  setSources,
  onAnalyze,
  onCancel,
  isLoading,
  loadingStage = 'Extracting claims…',
  isSlow = false,
  errorMessage,
  isOffline = false,
}) => {
  const countWords = (str: string) => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  const handleAddSource = () => {
    if (sources.length >= 3) return;
    const newIdx = sources.length + 1;
    setSources([
      ...sources,
      {
        id: `S${newIdx}`,
        label: `Source ${newIdx}`,
        text: '',
      },
    ]);
  };

  const handleRemoveSource = (idx: number) => {
    if (sources.length <= 1) return;
    const nextSources = sources
      .filter((_, i) => i !== idx)
      .map((s, i) => ({
        ...s,
        id: `S${i + 1}`,
      }));
    setSources(nextSources);
  };

  const handleSourceChange = (idx: number, field: 'label' | 'text', val: string) => {
    const updated = [...sources];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setSources(updated);
  };

  const reportWordCount = countWords(reportText);
  const isReportTooLong = reportWordCount > 300;
  const isReportEmpty = reportText.trim().length === 0;

  const validSources = sources.filter((s) => s.text && s.text.trim().length > 0);
  const hasAtLeastOneSource = validSources.length > 0;
  const anySourceTooLong = sources.some((s) => countWords(s.text) > 300);

  // Minimum valid input requirements
  const isFormValid =
    !isReportEmpty &&
    !isReportTooLong &&
    hasAtLeastOneSource &&
    !anySourceTooLong &&
    !isOffline;

  return (
    <section aria-label="Evidence Review Input Section" className="bg-[#FAF8F5] border-b border-[#DDD8CE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Workspace prompt */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-[#DDD8CE] flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAE7DF] flex items-center justify-center text-[#143D30] shrink-0">
              <Sparkles className="w-4 h-4 text-[#143D30]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#57534E]">
                Workspace Readiness
              </p>
              <p className="text-sm font-semibold text-[#15231D]">
                Paste a report and at least one source to begin an evidence review.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#78716C]">
            <span>Report: {reportWordCount}/300w</span>
            <span>·</span>
            <span>Sources: {validSources.length}/3</span>
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-center gap-3"
          >
            <WifiOff className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">You appear to be offline.</span> Check your connection and try again.
            </div>
          </div>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Notice</span>
              </div>
              <button
                type="button"
                onClick={onAnalyze}
                disabled={!isFormValid || isLoading}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Input Form (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border-b border-[#DDD8CE] pb-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#15231D] tracking-tight">
                Live Evidence Integrity Verification
              </h1>
              <p className="text-base text-[#57534E] mt-1">
                Paste a short report and 1–3 source documents to test whether the claims are genuinely supported or overreaching.
              </p>
            </div>

            {/* 1. Paste Report */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="report-text-input"
                  className="text-xs font-bold text-[#15231D] uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#143D30] text-white text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Paste your report</span>
                  <span className="text-xs font-normal text-[#78716C]">(≤ 300 words)</span>
                  <span className="text-red-600 text-xs font-bold" aria-hidden="true">*</span>
                </label>
                <span
                  className={`text-xs font-mono font-medium ${
                    isReportTooLong ? 'text-red-600 font-bold' : 'text-[#78716C]'
                  }`}
                  aria-live="polite"
                >
                  {reportWordCount}/300 words
                </span>
              </div>
              <textarea
                id="report-text-input"
                aria-required="true"
                aria-invalid={isReportTooLong}
                aria-describedby={
                  isReportTooLong
                    ? 'report-error-toolong'
                    : isReportEmpty
                    ? 'report-hint'
                    : undefined
                }
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Enter report text containing claims to be verified against the sources..."
                rows={4}
                className={`w-full text-base p-4 rounded-xl border bg-white text-[#15231D] placeholder:text-[#A8A29E] font-sans leading-relaxed transition-all focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none ${
                  isReportTooLong
                    ? 'border-red-500 ring-1 ring-red-400'
                    : 'border-[#DDD8CE] focus:border-[#143D30]'
                }`}
              />

              {/* Inline validation errors */}
              {isReportTooLong && (
                <p id="report-error-toolong" role="alert" className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <span>Report exceeds maximum limit of 300 words ({reportWordCount}/300 words). Please shorten your text.</span>
                </p>
              )}
              {isReportEmpty && (
                <p id="report-hint" className="text-xs text-[#78716C]">
                  Report text is required.
                </p>
              )}
            </div>

            {/* 2. Source Documents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#15231D] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#143D30] text-white text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <span>Add source documents (1–3)</span>
                  <span className="text-xs font-normal text-[#78716C]">(≤ 300 words each)</span>
                  <span className="text-red-600 text-xs font-bold" aria-hidden="true">*</span>
                </label>
                {sources.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddSource}
                    className="text-xs font-semibold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] rounded p-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add another source</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {sources.map((source, idx) => {
                  const sWordCount = countWords(source.text);
                  const isSourceTooLong = sWordCount > 300;
                  return (
                    <div
                      key={source.id || idx}
                      className="p-4 rounded-xl border border-[#DDD8CE] bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          aria-label={`Source ${idx + 1} label`}
                          value={source.label}
                          onChange={(e) => handleSourceChange(idx, 'label', e.target.value)}
                          placeholder={`Source ${idx + 1} label (e.g. Survey Results, Audit Report)`}
                          className="text-xs font-bold text-[#15231D] border-b border-transparent hover:border-[#DDD8CE] focus:border-[#143D30] focus-visible:outline-none px-1 py-0.5 w-80 max-w-full"
                        />
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-mono ${
                              isSourceTooLong ? 'text-red-600 font-bold' : 'text-[#78716C]'
                            }`}
                          >
                            {sWordCount}/300 words
                          </span>
                          {sources.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSource(idx)}
                              title="Remove source"
                              aria-label={`Remove Source ${idx + 1}`}
                              className="text-[#A8A29E] hover:text-red-600 p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        aria-label={`Source ${idx + 1} text`}
                        aria-required={idx === 0}
                        aria-invalid={isSourceTooLong}
                        value={source.text}
                        onChange={(e) => handleSourceChange(idx, 'text', e.target.value)}
                        placeholder={`Paste source text for ${source.label || `Source ${idx + 1}`} here...`}
                        rows={3}
                        className={`w-full text-base p-3.5 rounded-lg border bg-[#FAF8F5] text-[#15231D] placeholder:text-[#A8A29E] font-mono leading-relaxed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none ${
                          isSourceTooLong ? 'border-red-500' : 'border-[#DDD8CE]'
                        }`}
                      />
                      {isSourceTooLong && (
                        <p role="alert" className="text-xs text-red-600 font-semibold">
                          Source {idx + 1} exceeds 300 words ({sWordCount}/300 words).
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!hasAtLeastOneSource && (
                <p role="alert" className="text-xs text-[#78716C]">
                  At least one source document with text is required.
                </p>
              )}
            </div>

            {/* Action Bar & Loading States */}
            <div className="pt-2 space-y-3">
              {/* Aria-live stage announcement */}
              <div aria-live="polite" className="sr-only">
                {isLoading ? `Analysis in progress: ${loadingStage}` : ''}
              </div>

              {/* Slow request warning (> 8s) */}
              {isLoading && isSlow && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                    <span>Analysis is taking longer than expected. Your evidence review is still running.</span>
                  </div>
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAnalyze}
                  disabled={isLoading || !isFormValid}
                  aria-busy={isLoading}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-[#143D30] hover:bg-[#1E5242] text-white text-base font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="font-medium">{loadingStage}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-[#86EFAC]" />
                      <span>Analyze claims</span>
                    </>
                  )}
                </button>

                {/* Cancel button while loading */}
                {isLoading && onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-3 rounded-xl border border-[#DDD8CE] bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#15231D] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30]"
                  >
                    Cancel Analysis
                  </button>
                )}

                {/* Validation text helper when disabled */}
                {!isLoading && !isFormValid && (
                  <span className="text-xs text-[#78716C]">
                    {isOffline
                      ? 'Reconnection required to run analysis.'
                      : isReportEmpty
                      ? 'Enter a report to enable analysis.'
                      : isReportTooLong
                      ? 'Trim report to ≤ 300 words.'
                      : !hasAtLeastOneSource
                      ? 'Add at least 1 source document.'
                      : anySourceTooLong
                      ? 'Trim sources to ≤ 300 words.'
                      : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Protocol Cards (Col 4) */}
          <div className="lg:col-span-4 bg-[#FAF8F5] rounded-2xl border border-[#DDD8CE] p-6 space-y-5">
            <h2 className="text-xs uppercase tracking-wider font-bold text-[#57534E] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#143D30]" />
              <span>Evidence Integrity Protocol</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] text-[#143D30] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-[#143D30]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15231D]">Atomic Claim Decomposition</h3>
                  <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
                    Extracts independent, falsifiable claims while preserving exact quantifiers and population targets.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] text-[#143D30] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#1E6B35]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15231D]">Canonical Passage Mapping</h3>
                  <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
                    Source text is broken into verifiable passage IDs (e.g. S1-P1). Quoted evidence is displayed verbatim from original source text.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#DDD8CE] text-[#143D30] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#15231D]">Semantic Reasoning Stress Tests</h3>
                  <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed">
                    Flags metric mismatches, population leaps, causal overreach, and numeric divergences.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDD8CE] text-[11px] text-[#78716C] leading-relaxed">
              <span className="font-semibold text-[#15231D]">Live Integrity Rule:</span> No fake quotes or hallucinated passage citations. If evidence is insufficient, claims are marked Unsupported.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
