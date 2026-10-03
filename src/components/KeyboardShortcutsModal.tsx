import React from 'react';
import { X, Keyboard, ArrowDown, ArrowUp, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Claim Navigation (Workbench)',
      shortcuts: [
        { key: 'J', label: 'Select next claim' },
        { key: 'K', label: 'Select previous claim' },
        { key: '↓', label: 'Next claim (alternative)' },
        { key: '↑', label: 'Previous claim (alternative)' },
      ],
    },
    {
      title: 'Tab Navigation',
      shortcuts: [
        { key: '1', label: 'Switch to Workbench' },
        { key: '2', label: 'Switch to Compare Two Claims' },
      ],
    },
    {
      title: 'Active Claim Actions',
      shortcuts: [
        { key: 'R', label: 'Open Revise modal' },
        { key: 'F', label: 'Open Find Evidence guidance' },
        { key: 'I', label: 'Open Source Inspector' },
        { key: 'M', label: 'Open Manual Review override' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { key: '?', label: 'Toggle this shortcuts cheatsheet' },
        { key: 'Esc', label: 'Close open dialogs / modals' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150"
    >
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#DDD8CE] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DDD8CE] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAE7DF] flex items-center justify-center text-[#143D30]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 id="shortcuts-title" className="text-sm font-bold text-[#15231D] font-serif">
                Keyboard Navigation & Shortcuts
              </h3>
              <p className="text-xs text-[#78716C]">
                Designed for high-velocity evidence review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="text-[#78716C] hover:text-[#15231D] p-1.5 rounded-lg hover:bg-[#EFECE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#57534E] block">
                {group.title}
              </span>
              <div className="bg-white rounded-xl border border-[#DDD8CE] divide-y divide-[#EFECE6] overflow-hidden shadow-2xs">
                {group.shortcuts.map((sc, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center justify-between p-3 text-xs"
                  >
                    <span className="text-[#292524] font-medium">{sc.label}</span>
                    <kbd className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD8CE] text-[#143D30] font-mono text-[11px] font-bold rounded shadow-2xs min-w-[28px] text-center">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-[11px] text-[#78716C] leading-relaxed pt-1">
            Shortcuts are automatically paused whenever you are typing in an input field or text area.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDD8CE] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#143D30] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5242] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D30] focus-visible:outline-none cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
