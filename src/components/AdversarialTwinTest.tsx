import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const AdversarialTwinTest: React.FC = () => {
  const [sourceText, setSourceText] = useState(
    'Among 50 surveyed students, 40% reported enjoying the learning application.'
  );
  const [claimA, setClaimA] = useState(
    '40% of surveyed students enjoyed the learning application.'
  );
  const [claimB, setClaimB] = useState(
    'The learning application improved academic performance by 40%.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const handleRunComparison = async () => {
    if (!sourceText.trim() || !claimA.trim() || !claimB.trim()) {
      setErrorMsg('Please supply a source text and two claims to compare.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/evaluate-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          claimA,
          claimB,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Live claim comparison failed.');
      }

      const data = await res.json();
      setComparisonResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing live comparison.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadClassicExample = () => {
    setSourceText(
      'Among 50 surveyed students, 40% reported enjoying the learning application.'
    );
    setClaimA('40% of surveyed students enjoyed the learning application.');
    setClaimB(
      'The learning application improved academic performance by 40%.'
    );
    setComparisonResult(null);
    setErrorMsg(null);
  };

  const getOutcomeStyle = (outcome: string) => {
    switch (outcome) {
      case 'Supported':
        return 'bg-[#D7EED9] text-[#1E6B35] border-[#BDE0C1]';
      case 'Overreach detected':
        return 'bg-[#FDD9C2] text-[#A84315] border-[#FBC5A3]';
      case 'Contradicted':
        return 'bg-[#FCD8D8] text-[#B82B2B] border-[#F9BDBD]';
      case 'Needs review':
        return 'bg-[#F9E6B3] text-[#8C600B] border-[#F2D177]';
      case 'Unsupported':
      default:
        return 'bg-[#DCE1E3] text-[#4A5D68] border-[#CAD2D6]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#DDD8CE] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#57534E]">
            <FlaskConical className="w-4 h-4 text-[#143D30]" />
            <span>Interactive Tool · Live Claim Comparison</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#15231D] mt-1">
            Compare Two Claims Against the Same Source
          </h2>
          <p className="text-sm text-[#57534E] mt-0.5">
            Test how live Gemini semantic reasoning distinguishes exact evidence matches from subtle metric substitutions or overreach.
          </p>
        </div>

        <button
          onClick={handleLoadClassicExample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD8CE] bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#15231D] transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#143D30]" />
          <span>Load Classic Twin Test</span>
        </button>
      </div>

      {/* Input Section */}
      <div className="p-6 rounded-2xl bg-white border border-[#DDD8CE] space-y-6 shadow-2xs">
        {/* Source text */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#15231D] uppercase tracking-wider block">
            Source Passage Text
          </label>
          <textarea
            rows={2}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter the source statement to test against..."
            className="w-full text-base p-3.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F5] text-[#15231D] font-mono leading-relaxed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          />
        </div>

        {/* Claim A and Claim B inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E6B35] uppercase tracking-wider block">
              Claim A (Target 1)
            </label>
            <textarea
              rows={2}
              value={claimA}
              onChange={(e) => setClaimA(e.target.value)}
              placeholder="Enter first claim..."
              className="w-full text-base p-3 rounded-xl border border-[#DDD8CE] bg-[#FAF8F5] text-[#15231D] font-serif leading-relaxed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C2410C] uppercase tracking-wider block">
              Claim B (Target 2)
            </label>
            <textarea
              rows={2}
              value={claimB}
              onChange={(e) => setClaimB(e.target.value)}
              placeholder="Enter second claim..."
              className="w-full text-base p-3 rounded-xl border border-[#DDD8CE] bg-[#FAF8F5] text-[#15231D] font-serif leading-relaxed focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleRunComparison}
            disabled={isLoading || !sourceText.trim() || !claimA.trim() || !claimB.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#143D30] hover:bg-[#1E5242] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Evaluating Live with Gemini...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-[#86EFAC]" />
                <span>Compare Claims Live</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between gap-3">
            <span>{errorMsg}</span>
            <button
              onClick={handleRunComparison}
              disabled={isLoading}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Twin A Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#DDD8CE] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E6B35]">
                  CLAIM A EVALUATION
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getOutcomeStyle(
                    comparisonResult.twinA.outcome
                  )}`}
                >
                  {comparisonResult.twinA.outcome}
                </span>
              </div>

              <blockquote className="text-base font-serif font-bold text-[#15231D]">
                "{comparisonResult.twinA.claim}"
              </blockquote>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    PASSAGE ID CITED:
                  </span>
                  <span className="font-mono font-bold text-[#15231D]">
                    {comparisonResult.twinA.relevantPassageIds.join(', ') || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    RELATIONSHIP:
                  </span>
                  <span className="font-semibold text-[#15231D]">
                    {comparisonResult.twinA.evidenceRelationship}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    REASONING ISSUE:
                  </span>
                  <span className="font-semibold text-[#15231D]">
                    {comparisonResult.twinA.reasoningIssue}
                  </span>
                </div>
              </div>

              {comparisonResult.twinA.retrievedPassageText && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                    Verbatim Excerpt from Source Map:
                  </span>
                  <p className="text-xs font-mono p-3 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-[#15231D]">
                    "{comparisonResult.twinA.retrievedPassageText}"
                  </p>
                </div>
              )}

              <p className="text-xs text-[#57534E] leading-relaxed">
                {comparisonResult.twinA.explanation}
              </p>
            </div>

            {/* Twin B Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#DDD8CE] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                  CLAIM B EVALUATION
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getOutcomeStyle(
                    comparisonResult.twinB.outcome
                  )}`}
                >
                  {comparisonResult.twinB.outcome}
                </span>
              </div>

              <blockquote className="text-base font-serif font-bold text-[#15231D]">
                "{comparisonResult.twinB.claim}"
              </blockquote>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CE] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    PASSAGE ID CITED:
                  </span>
                  <span className="font-mono font-bold text-[#15231D]">
                    {comparisonResult.twinB.relevantPassageIds.join(', ') || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    RELATIONSHIP:
                  </span>
                  <span className="font-semibold text-[#15231D]">
                    {comparisonResult.twinB.evidenceRelationship}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#78716C]">
                    REASONING ISSUE:
                  </span>
                  <span className="font-semibold text-[#C2410C]">
                    {comparisonResult.twinB.reasoningIssue}
                  </span>
                </div>
              </div>

              {comparisonResult.twinB.retrievedPassageText && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                    Verbatim Excerpt from Source Map:
                  </span>
                  <p className="text-xs font-mono p-3 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE] text-[#15231D]">
                    "{comparisonResult.twinB.retrievedPassageText}"
                  </p>
                </div>
              )}

              <p className="text-xs text-[#57534E] leading-relaxed">
                {comparisonResult.twinB.explanation}
              </p>
            </div>
          </div>

          {/* Reasoning Difference Synthesis */}
          {comparisonResult.reasoningDifference && (
            <div className="p-5 rounded-2xl bg-[#EFECE6] border border-[#DDD8CE] space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#143D30] block">
                Reasoning Difference & Integrity Analysis
              </span>
              <p className="text-xs text-[#44403C] leading-relaxed">
                {comparisonResult.reasoningDifference}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
