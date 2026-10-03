import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AuditPanelProps {
  result: AnalysisResult;
  selectedClaimId: string;
  onSelectClaim: (id: string) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  result,
  selectedClaimId,
  onSelectClaim,
}) => {
  const { stats, claims } = result;

  const coveragePercent =
    stats.totalClaims > 0
      ? Math.round((stats.evidenceCoverage / stats.totalClaims) * 100)
      : 67;

  // Claims other than the currently selected one
  const relatedClaims = claims.filter((c) => c.id !== selectedClaimId);

  return (
    <div className="bg-[#FAF8F5] border-l border-[#DDD8CE] p-6 space-y-7 flex flex-col h-full overflow-y-auto">
      {/* Header & Breakdown */}
      <div className="space-y-4">
        <span className="text-xs uppercase tracking-wider font-bold text-[#57534E] block">
          AUDIT SCORE (DOCUMENT LEVEL)
        </span>

        <div className="space-y-3 text-xs font-medium text-[#292524]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E6B35]"></span>
              <span>Supported</span>
            </div>
            <span className="font-mono font-bold text-[#15231D]">
              {stats.supported}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E05315]"></span>
              <span>Overreach detected</span>
            </div>
            <span className="font-mono font-bold text-[#15231D]">
              {stats.overreach}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C22828]"></span>
              <span>Contradicted</span>
            </div>
            <span className="font-mono font-bold text-[#15231D]">
              {stats.contradicted}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5E717D]"></span>
              <span>Unsupported</span>
            </div>
            <span className="font-mono font-bold text-[#15231D]">
              {stats.unsupported}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C48813]"></span>
              <span>Needs review</span>
            </div>
            <span className="font-mono font-bold text-[#15231D]">
              {stats.needsReview}
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Coverage Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#15231D] flex items-center gap-1.5">
            <span>Evidence coverage</span>
            <span className="text-[#A8A29E] text-[10px] cursor-help">ⓘ</span>
          </span>
          <span className="font-mono text-xs text-[#57534E]">
            {stats.evidenceCoverage}/{stats.totalClaims} claims
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#DDD8CE] overflow-hidden">
          <div
            className="h-full bg-[#143D30] rounded-full transition-all duration-500"
            style={{ width: `${coveragePercent}%` }}
          ></div>
        </div>
      </div>

      {/* Key Insights Box */}
      <div className="p-4 rounded-xl bg-[#EFECE6] border border-[#DDD8CE] space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15231D]">
          <Lightbulb className="w-4 h-4 text-[#143D30]" />
          <span>KEY INSIGHTS</span>
        </div>
        <ul className="text-xs text-[#44403C] space-y-2 leading-relaxed">
          {stats.overreach > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-[#E05315] font-bold">·</span>
              <span>
                Overreach detected in {stats.overreach} claim(s): report makes assertions exceeding what source metrics establish.
              </span>
            </li>
          )}
          {stats.contradicted > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-[#C22828] font-bold">·</span>
              <span>
                Direct contradiction detected in {stats.contradicted} claim(s): source findings explicitly refute the claim.
              </span>
            </li>
          )}
          {stats.unsupported > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-[#5E717D] font-bold">·</span>
              <span>
                {stats.unsupported} claim(s) have no corroborating evidence in the provided source documents.
              </span>
            </li>
          )}
          {stats.supported > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B35] font-bold">·</span>
              <span>
                {stats.supported} claim(s) are directly corroborated by canonical source passages.
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Related Claims */}
      <div className="space-y-3 pt-1">
        <span className="text-xs uppercase tracking-wider font-bold text-[#57534E] block">
          RELATED CLAIMS
        </span>
        <div className="space-y-2 text-xs">
          {relatedClaims.map((c) => {
            let dotColor = 'bg-[#5E717D]';
            if (c.outcome === 'Supported') dotColor = 'bg-[#1E6B35]';
            if (c.outcome === 'Overreach detected') dotColor = 'bg-[#E05315]';
            if (c.outcome === 'Contradicted') dotColor = 'bg-[#C22828]';
            if (c.outcome === 'Needs review') dotColor = 'bg-[#C48813]';

            return (
              <button
                key={c.id}
                onClick={() => onSelectClaim(c.id)}
                className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#F3EFE8] transition-colors text-left cursor-pointer group"
              >
                <span className="font-mono text-xs font-semibold text-[#15231D] group-hover:text-[#143D30]">
                  {c.id}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                  <span className="text-[11px] text-[#57534E]">
                    {c.outcome}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
