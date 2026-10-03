/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ClaimsList } from './components/ClaimsList';
import { ClaimDetail } from './components/ClaimDetail';
import { AuditPanel } from './components/AuditPanel';
import { AdversarialTwinTest } from './components/AdversarialTwinTest';
import { InspectSourceModal } from './components/InspectSourceModal';
import { ReviseClaimModal } from './components/ReviseClaimModal';
import { FindEvidenceModal } from './components/FindEvidenceModal';
import { ManualReviewModal } from './components/ManualReviewModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  AnalysisResult,
  ClaimAnalysis,
  ClaimOutcome,
  SourceDocument,
} from './types';
import { Settings, AlertTriangle, ArrowLeft, CheckCircle2, WifiOff, Keyboard } from 'lucide-react';

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'workbench' | 'twin'>('workbench');
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Input states
  const [reportText, setReportText] = useState('');
  const [sources, setSources] = useState<SourceDocument[]>([
    {
      id: 'S1',
      label: 'Source 1',
      text: '',
    },
  ]);

  // Live Analysis result
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Extracting claims…');
  const [isSlow, setIsSlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Session state: track claims flagged for manual review
  const [humanReviewClaimIds, setHumanReviewClaimIds] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modals state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectPassageId, setInspectPassageId] = useState<string | undefined>();
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [targetReviseClaim, setTargetReviseClaim] = useState<ClaimAnalysis | null>(null);
  const [findEvidenceModalOpen, setFindEvidenceModalOpen] = useState(false);
  const [targetFindEvidenceClaim, setTargetFindEvidenceClaim] = useState<ClaimAnalysis | null>(null);
  const [manualReviewModalOpen, setManualReviewModalOpen] = useState(false);
  const [targetManualReviewClaim, setTargetManualReviewClaim] = useState<ClaimAnalysis | null>(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Mobile layout tab switcher
  const [mobileTab, setMobileTab] = useState<'claims' | 'detail' | 'audit'>('detail');

  // Refs for timers & abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageIntervalRef = useRef<any>(null);
  const slowTimerRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setErrorMessage(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setErrorMessage('You appear to be offline. Check your connection and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check health on mount to detect if server has live Gemini API key
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch(() => {
        setHasApiKey(false);
      });
  }, []);

  const cleanupLoadingTimers = () => {
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
  };

  // Handle Cancel Analysis
  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cleanupLoadingTimers();
    setIsLoading(false);
    setIsSlow(false);
    setErrorMessage('Analysis was cancelled. Click Retry to run the evidence review again.');
  };

  // Handle Analyze Claims (LIVE ONLY)
  const handleAnalyze = async () => {
    if (isOffline) {
      setErrorMessage('You appear to be offline. Check your connection and try again.');
      return;
    }

    if (!reportText.trim()) {
      setErrorMessage('Report text is required.');
      return;
    }

    const hasValidSource = sources.some((s) => s.text && s.text.trim().length > 0);
    if (!hasValidSource) {
      setErrorMessage('At least one source document with text is required.');
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cleanupLoadingTimers();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsSlow(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingStage('Extracting claims…');

    // Loading stages sequence
    const stages = [
      'Extracting claims…',
      'Segmenting source passages…',
      'Matching evidence…',
      'Checking reasoning gaps…',
    ];
    let stageIdx = 0;
    stageIntervalRef.current = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
      }
    }, 2000);

    // Slow network trigger after 8 seconds
    slowTimerRef.current = setTimeout(() => {
      setIsSlow(true);
    }, 8000);

    // Timeout trigger after 40 seconds
    timeoutTimerRef.current = setTimeout(() => {
      controller.abort();
      cleanupLoadingTimers();
      setIsLoading(false);
      setIsSlow(false);
      setErrorMessage(
        'Analysis request timed out. Live AI analysis is unavailable right now. Check the server configuration or try again shortly.'
      );
    }, 40000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          reportText,
          sources: sources.filter((s) => s.text.trim().length > 0),
        }),
      });

      cleanupLoadingTimers();

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.'
        );
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      if (data.claims.length > 0) {
        setSelectedClaimId(data.claims[0].id);
      }
      setSuccessMessage(
        `Analysis complete: ${data.claims.length} claim(s) extracted and verified against ${data.passages.length} source passages.`
      );
      setActiveTab('workbench');

      // Accessibility: scroll smoothly to the results area
      setTimeout(() => {
        resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      cleanupLoadingTimers();
      if (err.name === 'AbortError') {
        // Handled by cancel / timeout
        return;
      }
      console.error('Live analysis failed:', err);
      setErrorMessage(
        err.message ||
          'Live AI analysis is unavailable right now. Check the server configuration or try again shortly.'
      );
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
      setIsSlow(false);
    }
  };

  const handleResetToInput = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionFeedback(null);
  };

  // Currently selected claim
  const selectedClaim =
    analysisResult?.claims.find((c) => c.id === selectedClaimId) ||
    analysisResult?.claims[0] ||
    null;

  // Handlers for modal triggers
  const handleOpenRevise = (claim: ClaimAnalysis) => {
    setTargetReviseClaim(claim);
    setReviseModalOpen(true);
  };

  const handleOpenFindEvidence = (claim: ClaimAnalysis) => {
    setTargetFindEvidenceClaim(claim);
    setFindEvidenceModalOpen(true);
  };

  const handleOpenInspectSource = (passageId?: string) => {
    setInspectPassageId(passageId);
    setInspectModalOpen(true);
    setActionFeedback(
      passageId ? `Opened source context for passage ${passageId}.` : 'Opened source documents context.'
    );
  };

  const handleOpenManualReview = (claim: ClaimAnalysis) => {
    setTargetManualReviewClaim(claim);
    setManualReviewModalOpen(true);
  };

  const handleApplyRevision = (claimId: string, revisedText: string) => {
    if (!analysisResult) return;
    const updatedClaims = analysisResult.claims.map((c) => {
      if (c.id === claimId) {
        return {
          ...c,
          text: revisedText,
          outcome: 'Supported' as ClaimOutcome,
          evidenceRelationship: 'Supports' as const,
          reasoningIssue: 'None' as const,
          explanation: 'Revised to match source evidence.',
        };
      }
      return c;
    });

    setAnalysisResult({
      ...analysisResult,
      claims: updatedClaims,
      stats: {
        ...analysisResult.stats,
        supported: updatedClaims.filter((c) => c.outcome === 'Supported').length,
        overreach: updatedClaims.filter((c) => c.outcome === 'Overreach detected').length,
      },
    });

    setActionFeedback(`Revision applied to claim ${claimId}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleUpdateOutcome = (
    claimId: string,
    outcome: ClaimOutcome,
    note: string
  ) => {
    if (!analysisResult) return;
    const updatedClaims = analysisResult.claims.map((c) => {
      if (c.id === claimId) {
        return {
          ...c,
          outcome,
          explanation: note ? `${c.explanation} (Auditor Note: ${note})` : c.explanation,
        };
      }
      return c;
    });

    setAnalysisResult({
      ...analysisResult,
      claims: updatedClaims,
      stats: {
        ...analysisResult.stats,
        supported: updatedClaims.filter((c) => c.outcome === 'Supported').length,
        overreach: updatedClaims.filter((c) => c.outcome === 'Overreach detected').length,
        contradicted: updatedClaims.filter((c) => c.outcome === 'Contradicted').length,
        needsReview: updatedClaims.filter((c) => c.outcome === 'Needs review').length,
        unsupported: updatedClaims.filter((c) => c.outcome === 'Unsupported').length,
      },
    });

    // Mark as human-reviewed in session
    setHumanReviewClaimIds((prev) => new Set([...prev, claimId]));
    setActionFeedback(`Claim ${claimId} marked as human-reviewed in current session (Outcome: ${outcome}).`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Global Keyboard Shortcuts (J/K claim cycling, tab toggling, quick actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is currently typing in an input / textarea / select, skip shortcuts
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true');

      // Escape closes open dialogs/modals
      if (e.key === 'Escape') {
        if (shortcutsModalOpen) setShortcutsModalOpen(false);
        if (inspectModalOpen) setInspectModalOpen(false);
        if (reviseModalOpen) setReviseModalOpen(false);
        if (findEvidenceModalOpen) setFindEvidenceModalOpen(false);
        if (manualReviewModalOpen) setManualReviewModalOpen(false);
        return;
      }

      if (isInput) return;

      const isAnyModalOpen =
        shortcutsModalOpen ||
        inspectModalOpen ||
        reviseModalOpen ||
        findEvidenceModalOpen ||
        manualReviewModalOpen;

      // Toggle shortcuts help with '?'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Do not trigger background shortcuts if a modal is open
      if (isAnyModalOpen) return;

      // Tab toggling: 1 or W -> workbench; 2 or T -> twin
      if (e.key === '1' || e.key.toLowerCase() === 'w') {
        setActiveTab('workbench');
        return;
      }
      if (e.key === '2' || e.key.toLowerCase() === 't') {
        setActiveTab('twin');
        return;
      }

      // Claim navigation and actions in workbench review mode
      if (activeTab === 'workbench' && analysisResult && analysisResult.claims.length > 0) {
        const claims = analysisResult.claims;
        const currentIndex = claims.findIndex((c) => c.id === selectedClaimId);

        // Next claim: 'j', 'J', or 'ArrowDown'
        if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = currentIndex < claims.length - 1 ? currentIndex + 1 : 0;
          setSelectedClaimId(claims[nextIndex].id);
          setMobileTab('detail');
          return;
        }

        // Previous claim: 'k', 'K', or 'ArrowUp'
        if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : claims.length - 1;
          setSelectedClaimId(claims[prevIndex].id);
          setMobileTab('detail');
          return;
        }

        const currentClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

        // Quick action shortcuts
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          handleOpenRevise(currentClaim);
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          handleOpenFindEvidence(currentClaim);
          return;
        }
        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          handleOpenInspectSource(currentClaim.relevantPassageIds[0]);
          return;
        }
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handleOpenManualReview(currentClaim);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    analysisResult,
    selectedClaimId,
    shortcutsModalOpen,
    inspectModalOpen,
    reviseModalOpen,
    findEvidenceModalOpen,
    manualReviewModalOpen,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EFE8] text-[#15231D] antialiased overflow-x-hidden">
      {/* Top Header */}
      <Header
        hasApiKey={hasApiKey}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewAnalysis={handleResetToInput}
        hasAnalysis={Boolean(analysisResult)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* Offline Alert Bar */}
      {isOffline && (
        <div
          role="alert"
          className="bg-amber-100 border-b border-amber-300 px-4 py-3 text-xs sm:text-sm text-amber-900 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            You appear to be offline. Check your connection and try again.
          </span>
        </div>
      )}

      {/* Missing API Key Banner */}
      {!hasApiKey && (
        <div
          role="alert"
          className="bg-red-50 border-b border-red-200 px-4 py-3 text-xs sm:text-sm text-red-800 flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">
            Live AI analysis is unavailable right now. Check the server configuration or try again shortly.
          </span>
        </div>
      )}

      {/* Main Surface */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="flex-1 flex flex-col">
            {/* If no analysis result yet, display input section */}
            {!analysisResult ? (
              <InputSection
                reportText={reportText}
                setReportText={setReportText}
                sources={sources}
                setSources={setSources}
                onAnalyze={handleAnalyze}
                onCancel={handleCancelAnalysis}
                isLoading={isLoading}
                loadingStage={loadingStage}
                isSlow={isSlow}
                errorMessage={errorMessage}
                isOffline={isOffline}
              />
            ) : (
              /* If analysis result exists, display the 3-column review workbench */
              <div ref={resultsContainerRef} className="flex-1 flex flex-col animate-in fade-in duration-200">
                {/* Secondary navigation bar with Edit Inputs & Success message */}
                <div className="bg-[#FAF8F5] border-b border-[#DDD8CE] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetToInput}
                      className="flex items-center gap-1.5 font-semibold text-[#143D30] hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D30] rounded p-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Input Form</span>
                    </button>

                    <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#78716C] bg-white border border-[#DDD8CE] px-2.5 py-1 rounded-md shadow-2xs">
                      <Keyboard className="w-3 h-3 text-[#143D30]" />
                      <span>Use <kbd className="px-1 py-0.5 bg-[#FAF8F5] border border-[#DDD8CE] rounded font-mono text-[10px] text-[#143D30] font-bold">J</kbd>/<kbd className="px-1 py-0.5 bg-[#FAF8F5] border border-[#DDD8CE] rounded font-mono text-[10px] text-[#143D30] font-bold">K</kbd> to cycle claims</span>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setShortcutsModalOpen(true)}
                        className="text-[#143D30] hover:underline font-semibold cursor-pointer"
                      >
                        shortcuts (?)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {successMessage && (
                      <span className="text-[#1E6B35] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#1E6B35]" />
                        <span>{successMessage}</span>
                      </span>
                    )}
                    <span className="text-[#78716C] font-mono text-[11px] hidden sm:inline">
                      {analysisResult.passages.length} passages · {analysisResult.claims.length} claims
                    </span>
                  </div>
                </div>

                {/* Mobile Tab Toggle */}
                <div className="md:hidden flex border-b border-[#DDD8CE] bg-[#FAF8F5] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setMobileTab('claims')}
                    className={`flex-1 py-2.5 text-center font-semibold rounded ${
                      mobileTab === 'claims' ? 'bg-[#143D30] text-white' : 'text-[#78716C]'
                    }`}
                  >
                    Claims ({analysisResult.claims.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab('detail')}
                    className={`flex-1 py-2.5 text-center font-semibold rounded ${
                      mobileTab === 'detail' ? 'bg-[#143D30] text-white' : 'text-[#78716C]'
                    }`}
                  >
                    Detail ({selectedClaim?.id})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab('audit')}
                    className={`flex-1 py-2.5 text-center font-semibold rounded ${
                      mobileTab === 'audit' ? 'bg-[#143D30] text-white' : 'text-[#78716C]'
                    }`}
                  >
                    Audit Score
                  </button>
                </div>

                {/* 3-Column Review Dashboard */}
                <div className="flex-1 max-w-[1520px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-8rem)]">
                  {/* Column 1: Claims List */}
                  <div
                    className={`md:col-span-3 lg:col-span-3 ${
                      mobileTab === 'claims' ? 'block' : 'hidden md:block'
                    }`}
                  >
                    <ClaimsList
                      claims={analysisResult.claims}
                      selectedClaimId={selectedClaimId}
                      humanReviewClaimIds={humanReviewClaimIds}
                      onSelectClaim={(id) => {
                        setSelectedClaimId(id);
                        setMobileTab('detail');
                      }}
                    />
                  </div>

                  {/* Column 2: Selected Claim Detail */}
                  <div
                    className={`md:col-span-6 lg:col-span-6 bg-[#FAF8F5] ${
                      mobileTab === 'detail' ? 'block' : 'hidden md:block'
                    }`}
                  >
                    {selectedClaim ? (
                      <ClaimDetail
                        claim={selectedClaim}
                        passages={analysisResult.passages}
                        isHumanReviewRequested={humanReviewClaimIds.has(selectedClaim.id)}
                        onOpenRevise={handleOpenRevise}
                        onOpenFindEvidence={handleOpenFindEvidence}
                        onOpenInspectSource={handleOpenInspectSource}
                        onOpenManualReview={handleOpenManualReview}
                        actionFeedback={actionFeedback}
                      />
                    ) : (
                      <div className="p-12 text-center text-[#78716C] text-base space-y-2">
                        <p className="font-semibold text-[#15231D]">No claim selected.</p>
                        <p className="text-sm">Select a claim from the list on the left to inspect its evidence chain.</p>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Audit Panel */}
                  <div
                    className={`md:col-span-3 lg:col-span-3 ${
                      mobileTab === 'audit' ? 'block' : 'hidden md:block'
                    }`}
                  >
                    <AuditPanel
                      result={analysisResult}
                      selectedClaimId={selectedClaimId}
                      onSelectClaim={(id) => {
                        setSelectedClaimId(id);
                        setMobileTab('detail');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPARE TWO CLAIMS (USER-DRIVEN ADVERSARIAL TWIN) */}
        {activeTab === 'twin' && (
          <div className="flex-1 bg-[#FAF8F5]">
            <AdversarialTwinTest />
          </div>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#DDD8CE] bg-[#FAF8F5] py-4 text-xs text-[#78716C]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Built for LovHack Season 3.</span>
            <span>AI-assisted development.</span>
            <span>Evidence integrity workbench.</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#57534E]">
            <Settings className="w-3.5 h-3.5 text-[#78716C]" />
            <span>AI assessment</span>
            <span>·</span>
            <span>human review required</span>
          </div>
        </div>
      </footer>

      {/* Inspect Source Modal */}
      {analysisResult && (
        <InspectSourceModal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          sources={analysisResult.sources}
          passages={analysisResult.passages}
          highlightPassageId={inspectPassageId}
        />
      )}

      {/* Revise Claim Modal */}
      <ReviseClaimModal
        claim={targetReviseClaim}
        isOpen={reviseModalOpen}
        onClose={() => setReviseModalOpen(false)}
        onApplyRevision={handleApplyRevision}
      />

      {/* Find Evidence Modal */}
      <FindEvidenceModal
        claim={targetFindEvidenceClaim}
        isOpen={findEvidenceModalOpen}
        onClose={() => setFindEvidenceModalOpen(false)}
      />

      {/* Manual Review Modal */}
      <ManualReviewModal
        claim={targetManualReviewClaim}
        isOpen={manualReviewModalOpen}
        onClose={() => setManualReviewModalOpen(false)}
        onUpdateOutcome={handleUpdateOutcome}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
