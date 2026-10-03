import React from 'react';
import { ShieldCheck, Plus, FlaskConical, AlertTriangle, Keyboard } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  activeTab: 'workbench' | 'twin';
  setActiveTab: (tab: 'workbench' | 'twin') => void;
  onNewAnalysis: () => void;
  hasAnalysis: boolean;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  activeTab,
  setActiveTab,
  onNewAnalysis,
  hasAnalysis,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5] border-b border-[#DDD8CE] shadow-2xs">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#143D30] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#86EFAC]" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold tracking-tight text-[#15231D] font-serif">
                claimcheck
              </span>
              <span className="text-[#B8B2A6]">|</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#57534E]">
                evidence integrity workbench
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'workbench'
                  ? 'bg-[#143D30] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#15231D] hover:bg-[#EFECE6]'
              }`}
            >
              Workbench
            </button>
            <button
              onClick={() => setActiveTab('twin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'twin'
                  ? 'bg-[#143D30] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#15231D] hover:bg-[#EFECE6]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Compare Two Claims</span>
            </button>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-3">
            {hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-[#D7EED9] text-[#1E6B35] border border-[#BDE0C1]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                LIVE AI ANALYSIS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                <AlertTriangle className="w-3.5 h-3.5" />
                API KEY NOT CONFIGURED
              </span>
            )}

            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (Press ?)"
                aria-label="View keyboard shortcuts"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-[#57534E] hover:text-[#15231D] hover:bg-[#EFECE6] border border-transparent hover:border-[#DDD8CE] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30]"
              >
                <Keyboard className="w-3.5 h-3.5 text-[#78716C]" />
                <span className="hidden md:inline">Shortcuts</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-[#DDD8CE] text-[10px] font-mono rounded text-[#78716C]">
                  ?
                </kbd>
              </button>
            )}

            {hasAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#DDD8CE] text-[#15231D] hover:bg-[#F4F1EA] transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30]"
              >
                <Plus className="w-3.5 h-3.5 text-[#143D30]" />
                <span>New Analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
