import React from 'react';
import {
  ShieldCheck,
  Plus,
  FlaskConical,
  AlertTriangle,
  Keyboard,
  Layers,
} from 'lucide-react';

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
        {/* Row 1: App Title & Global Status / Utility Actions */}
        <div className="flex items-center justify-between py-3.5 border-b border-[#EFECE6]">
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#143D30] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#15231D] font-serif">
                claimcheck
              </span>
              <span className="hidden sm:inline text-[#B8B2A6]">|</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#57534E]">
                evidence integrity workbench
              </span>
            </div>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-[#D7EED9] text-[#1E6B35] border border-[#BDE0C1]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                <span className="hidden sm:inline">LIVE AI ANALYSIS</span>
                <span className="sm:hidden">LIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">API KEY NOT CONFIGURED</span>
                <span className="sm:hidden">OFFLINE</span>
              </span>
            )}

            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (Press ?)"
                aria-label="View keyboard shortcuts"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-[#57534E] hover:text-[#15231D] hover:bg-[#EFECE6] border border-transparent hover:border-[#DDD8CE] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30]"
              >
                <Keyboard className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Shortcuts</span>
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

        {/* Row 2: Prominent Tab Navigation Bar directly below the app title */}
        <div className="py-2.5 sm:py-3 flex items-center">
          <nav
            aria-label="Main Navigation Modes"
            className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={() => setActiveTab('workbench')}
              aria-current={activeTab === 'workbench' ? 'page' : undefined}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-semibold rounded-xl transition-all cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none ${
                activeTab === 'workbench'
                  ? 'bg-[#143D30] text-white border-2 border-[#143D30] shadow-sm'
                  : 'bg-[#EFECE6] text-[#292524] border border-[#DDD8CE] hover:bg-[#E4DFD5] hover:text-[#15231D] hover:border-[#C8C2B4]'
              }`}
            >
              <Layers
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                  activeTab === 'workbench' ? 'text-[#86EFAC]' : 'text-[#57534E]'
                }`}
              />
              <span>Workbench</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('twin')}
              aria-current={activeTab === 'twin' ? 'page' : undefined}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-semibold rounded-xl transition-all cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none ${
                activeTab === 'twin'
                  ? 'bg-[#143D30] text-white border-2 border-[#143D30] shadow-sm'
                  : 'bg-[#EFECE6] text-[#292524] border border-[#DDD8CE] hover:bg-[#E4DFD5] hover:text-[#15231D] hover:border-[#C8C2B4]'
              }`}
            >
              <FlaskConical
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                  activeTab === 'twin' ? 'text-[#86EFAC]' : 'text-[#57534E]'
                }`}
              />
              <span>Compare Two Claims</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
