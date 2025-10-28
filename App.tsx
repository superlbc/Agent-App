import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { HelpModal } from './components/HelpModal';
import { LoadingModal } from './components/ui/LoadingModal';
import { Toast } from './components/ui/Toast';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { TestAgentBanner } from './components/ui/TestAgentBanner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateNotes } from './services/apiService';
import { Controls, Payload, AgentResponse, FormState, ToastState, ApiConfig } from './types';
import { SAMPLE_DATA } from './constants';
import { Button } from './components/ui/Button';
import { Icon } from './components/ui/Icon';
import { TourProvider, useTourContext } from './contexts/TourContext';
import { TourController } from './components/tour/TourController';
import { TourWelcomeModal } from './components/tour/TourWelcomeModal';
import { useAuth } from './contexts/AuthContext';
import { telemetryService } from './utils/telemetryService';
import { getBrowserContext } from './utils/browserContext';
import { FeedbackButton } from './components/FeedbackButton';
import { useParticipantExtraction } from './hooks/useParticipantExtraction';
import { resetAllUserData } from './utils/resetUserData';

const DEFAULT_CONTROLS: Controls = {
  focus_department: [],
  view: 'full',
  critical_lens: true,
  audience: 'department-specific',
  tone: 'professional',
  redact: false,
  status_view: 'embedded',
  meeting_date: new Date().toISOString().split('T')[0],
  rag_mode: 'rag',
  use_icons: true,
  bold_important_words: false,
  meetingPreset: 'internal-sync',
  meeting_coach: true,
  coaching_style: 'gentle',
};

const AppContent: React.FC = () => {
  const { t } = useTranslation(['common', 'forms']);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [formState, setFormState] = useLocalStorage<FormState>('formState', {
    title: '',
    agenda: '',
    transcript: '',
    transcriptSource: 'manual',
    tags: ["Internal only"],
  });

  // Dual Agent Architecture: Separate IDs for meeting notes and interrogation
  // Hard-coded defaults with env override capability
  const DEFAULT_NOTES_AGENT_ID = (import.meta.env)?.VITE_DEFAULT_NOTES_AGENT_ID || 'b8460071-daee-4820-8198-5224fdc99e45';
  const DEFAULT_INTERROGATION_AGENT_ID = (import.meta.env)?.VITE_DEFAULT_INTERROGATION_AGENT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044';

  const [notesAgentId, setNotesAgentId] = useLocalStorage<string>(
    'notesAgentId',
    DEFAULT_NOTES_AGENT_ID
  );
  const [interrogationAgentId, setInterrogationAgentId] = useLocalStorage<string>(
    'interrogationAgentId',
    DEFAULT_INTERROGATION_AGENT_ID
  );

  const apiConfig: ApiConfig = {
    hostname: 'https://interact.interpublic.com',
    clientId: (import.meta.env)?.VITE_CLIENT_ID || '',
    clientSecret: (import.meta.env)?.VITE_CLIENT_SECRET || '',
    notesAgentId: notesAgentId,
    interrogationAgentId: interrogationAgentId,
  };

  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);

  const [output, setOutput] = useState<AgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [generateTrigger, setGenerateTrigger] = useState(0); // Trigger for collapsing Advanced Settings

  const { startTour, isTourActive } = useTourContext();
  const { isAuthenticated, user } = useAuth();

  // AbortController ref for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastGenerateTimeRef = useRef<number>(0);

  // Check if using custom agent IDs (test agents)
  const isUsingTestAgent =
    (notesAgentId !== DEFAULT_NOTES_AGENT_ID && notesAgentId !== '') ||
    (interrogationAgentId !== DEFAULT_INTERROGATION_AGENT_ID && interrogationAgentId !== '');

  // Participant extraction hook
  const {
    participants,
    isExtracting,
    extractAndMatch,
    addParticipant,
    batchAddParticipantsFromEmails,
    removeParticipant,
    searchAndMatch,
    confirmMatch,
    markAsExternal,
    updateParticipant,
    clearParticipants
  } = useParticipantExtraction();

  useEffect(() => {
    const tourCompleted = localStorage.getItem('tourCompleted');
    if (!tourCompleted) {
      setTimeout(() => setShowWelcomeModal(true), 500);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Clear transcript on page refresh/load
  useEffect(() => {
    if (formState.transcript) {
      setFormState(prev => ({
        ...prev,
        transcript: ''
      }));
      setOutput(null);
      setHasGenerated(false);
      clearParticipants();
    }
  }, []); // Empty dependency array - runs once on mount

  // Telemetry: Set user context when authentication changes
  useEffect(() => {
    telemetryService.setUser(user);
  }, [user]);

  // Telemetry: Track user login (once per session)
  useEffect(() => {
    // Check if login event already tracked in this session
    const hasTrackedLogin = sessionStorage.getItem('hasTrackedLogin') === 'true';

    if (isAuthenticated && user && !hasTrackedLogin) {
      // Mark as tracked for this session (persists across page refreshes)
      sessionStorage.setItem('hasTrackedLogin', 'true');

      // Capture comprehensive browser/device context
      const browserContext = getBrowserContext(isDarkMode);

      // Track login event with context
      telemetryService.trackEvent('userLogin', browserContext);
    }
  }, [isAuthenticated, user, isDarkMode]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
    addToast(t('common:toasts.generationCancelled'), 'error');

    // Telemetry: Track cancellation
    telemetryService.trackEvent('generationCancelled', {});
  }, [t, addToast]);

  const handleGenerate = useCallback(async (currentFormState: FormState, currentControls: Controls) => {
    if (!apiConfig.clientId || !apiConfig.clientSecret || !apiConfig.notesAgentId || !apiConfig.interrogationAgentId) {
        addToast(t('common:toasts.apiConfigMissing'), 'error');
        return;
    }

    // Cooldown check: prevent rapid repeated requests (3 seconds)
    const now = Date.now();
    const timeSinceLastGenerate = now - lastGenerateTimeRef.current;
    if (timeSinceLastGenerate < 3000) {
      addToast(t('common:toasts.pleasewait'), 'error');
      return;
    }
    lastGenerateTimeRef.current = now;

    setIsLoading(true);
    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Set up 3-minute (180 seconds) timeout
    timeoutIdRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }, 180000);

    // Generate correlation ID for tracking related events
    const correlationId = crypto.randomUUID();

    try {
      const payload: Payload = {
        meeting_title: currentFormState.title,
        agenda: currentFormState.agenda.split('\n').filter(line => line.trim() !== ''),
        transcript: currentFormState.transcript,
        user_notes: currentFormState.userNotes,  // Include user-provided notes
        participants: participants.length > 0 ? participants : undefined,  // NEW: Include participants for AI context
        controls: currentControls,
      };

      const response = await generateNotes(payload, apiConfig, signal);
      setOutput(response);

      // Telemetry: Track notes generation with details
      const eventType = hasGenerated ? 'notesRegenerated' : 'notesGenerated';
      telemetryService.trackEvent(eventType, {
        meetingTitle: currentFormState.title,
        transcriptLength: currentFormState.transcript.length,
        agendaItemCount: payload.agenda.length,
        audience: currentControls.audience,
        tone: currentControls.tone,
        viewMode: currentControls.view,
        meetingCoachEnabled: currentControls.meeting_coach,
        coachingStyle: currentControls.coaching_style,
        preset: currentControls.meetingPreset,
        criticalLens: currentControls.critical_lens,
        redactionEnabled: currentControls.redact,
        useIcons: currentControls.use_icons,
        boldKeywords: currentControls.bold_important_words,
        actionItemCount: response.next_steps?.length || 0,
        hasTags: currentFormState.tags.length > 0,
        // NEW: Participant context telemetry
        participantCount: participants.length,
        hasParticipantContext: participants.length > 0,
        hasParticipationMetrics: response.coach_insights?.participation_metrics !== undefined
      }, correlationId);

      setHasGenerated(true);
      if(hasGenerated) {
        addToast(t('common:toasts.previewUpdated'), 'success');
      } else {
        addToast(t('common:toasts.notesGenerated'), 'success');
      }
    } catch (err) {
      // Handle cancellation separately
      if (err instanceof Error && err.message === 'GENERATION_CANCELLED') {
        // Cancellation already handled by handleCancelGeneration
        // Don't show additional error toast
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setOutput(null);
      addToast(errorMessage, 'error');
    } finally {
      // Clean up AbortController and timeout
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setIsLoading(false);
    }
  }, [hasGenerated, apiConfig, user, participants, t, addToast]);

  const handleGenerateClick = () => {
    setGenerateTrigger(prev => prev + 1); // Increment to trigger Advanced Settings collapse
    handleGenerate(formState, controls);
  };

  const handleClearForm = useCallback(() => {
    setFormState({ title: '', agenda: '', transcript: '', transcriptSource: 'manual', userNotes: undefined, tags: [] });
    setOutput(null);
    setHasGenerated(false);
    clearParticipants();

    // Telemetry: DISABLED - formCleared generates too many events with low analytical value
    // telemetryService.trackEvent('formCleared', {});
  }, [setFormState, clearParticipants]);

  const handleUseSampleData = useCallback(() => {
    setFormState(SAMPLE_DATA);

    // Telemetry: DISABLED - sampleDataLoaded only useful during testing phase
    // telemetryService.trackEvent('sampleDataLoaded', {
    //   sampleTitle: SAMPLE_DATA.title
    // });
  }, [setFormState]);
  
  const handleReplayTour = () => {
    setShowWelcomeModal(true);
  };

  const handleResetUserData = useCallback(() => {
    // Confirm with user before resetting
    if (window.confirm(t('common:resetData.confirmMessage'))) {
      // Reset all localStorage data
      resetAllUserData();

      // Immediately clear form state and participants for visual feedback
      setFormState({ title: '', agenda: '', transcript: '', transcriptSource: 'manual', tags: [] });
      setOutput(null);
      setHasGenerated(false);
      clearParticipants();

      // Telemetry: Track data reset
      telemetryService.trackEvent('userDataReset', {});

      // Show success toast
      addToast(t('common:toasts.dataReset'), 'success');

      // Reload the page to apply all defaults
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [t, addToast, setFormState, clearParticipants]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Alt is pressed without Ctrl or Meta (Cmd)
      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      // Prevent shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          // Alt+G: Generate Notes
          e.preventDefault();
          if (!isLoading && formState.transcript) {
            handleGenerateClick();
          }
          break;

        case 'k':
          // Alt+K: Clear Form
          e.preventDefault();
          handleClearForm();
          addToast(t('common:toasts.formCleared'), 'success');
          break;

        case 'o':
          // Alt+O: Open File Upload
          e.preventDefault();
          if ((window as any).__fileUploadTrigger) {
            (window as any).__fileUploadTrigger();
          }
          break;

        case 'h':
          // Alt+H: Help
          e.preventDefault();
          setIsHelpOpen(true);
          break;

        case 'c':
          // Alt+C: Copy to clipboard (if output exists)
          e.preventDefault();
          if (output) {
            // Trigger copy from OutputPanel
            const copyButton = document.querySelector('[aria-label*="Copy"]') as HTMLButtonElement;
            if (copyButton) copyButton.click();
          }
          break;

        case 'p':
          // Alt+P: Export to PDF (if output exists)
          e.preventDefault();
          if (output) {
            const pdfButton = document.querySelector('[aria-label*="PDF"]') as HTMLButtonElement;
            if (pdfButton) pdfButton.click();
          }
          break;

        case 's':
          // Alt+S: Download CSV (if output exists)
          e.preventDefault();
          if (output) {
            const csvButton = document.querySelector('[aria-label*="CSV"]') as HTMLButtonElement;
            if (csvButton) csvButton.click();
          }
          break;

        case 'i':
          // Alt+I: Interrogate Transcript (if output exists)
          e.preventDefault();
          if (output) {
            const interrogateButton = document.querySelector('[aria-label*="Interrogate"]') as HTMLButtonElement;
            if (interrogateButton) interrogateButton.click();
          }
          break;

        case ',':
          // Alt+,: Settings
          e.preventDefault();
          setIsSettingsOpen(true);
          break;

        case 't':
          // Alt+T: Replay Tour
          e.preventDefault();
          handleReplayTour();
          break;
      }

      // Escape key to close modals (without Alt)
      if (e.key === 'Escape' && !e.altKey) {
        if (isHelpOpen) {
          e.preventDefault();
          setIsHelpOpen(false);
        } else if (isSettingsOpen) {
          e.preventDefault();
          setIsSettingsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isLoading,
    formState,
    output,
    isHelpOpen,
    isSettingsOpen,
    handleGenerateClick,
    handleClearForm,
    handleReplayTour,
    addToast,
    t,
  ]);

  return (
    <div className="min-h-screen font-sans">
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReplayTour={handleReplayTour}
        onReset={handleResetUserData}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {isUsingTestAgent && (
          <TestAgentBanner onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-[500px] flex-shrink-0">
            <div id="generate-button-wrapper" className="sticky top-24 z-30 mb-6">
                <Button id="generate-button" onClick={handleGenerateClick} disabled={isLoading || !formState.transcript} size="lg" className="w-full text-base shadow-lg dark:shadow-primary/20">
                {isLoading ? (
                    <>
                        <Icon name="loader" className="h-5 w-5 mr-2 animate-spin"/>
                        {t('common:status.generating')}
                    </>
                ) : (
                    <>
                        <Icon name="sparkles" className="h-5 w-5 mr-2"/>
                        {t('forms:actions.generateNotes')}
                    </>
                )}
                </Button>
            </div>
            <InputPanel
              formState={formState}
              setFormState={setFormState}
              controls={controls}
              setControls={setControls}
              addToast={addToast}
              onClearForm={() => { handleClearForm(); addToast(t('common:toasts.formCleared'), 'success'); }}
              onUseSampleData={() => { handleUseSampleData(); addToast(t('common:toasts.sampleDataLoaded'), 'success'); }}
              isTourActive={isTourActive}
              onTriggerFileUpload={() => {}}
              participants={participants}
              isExtracting={isExtracting}
              onExtractAndMatch={extractAndMatch}
              onAddParticipant={addParticipant}
              onBatchAddParticipants={batchAddParticipantsFromEmails}
              onRemoveParticipant={removeParticipant}
              onSearchAndMatch={searchAndMatch}
              onConfirmMatch={confirmMatch}
              onMarkAsExternal={markAsExternal}
              onUpdateParticipant={updateParticipant}
              generateTrigger={generateTrigger}
            />
          </div>
          <div id="output-panel-wrapper" className="flex-1 min-w-0 w-full">
            <OutputPanel
              output={output}
              isLoading={isLoading}
              error={error}
              controls={controls}
              addToast={addToast}
              formState={formState}
              apiConfig={apiConfig}
              participants={participants}
            />
          </div>
        </div>
      </main>
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        addToast={addToast}
        notesAgentId={notesAgentId}
        setNotesAgentId={setNotesAgentId}
        interrogationAgentId={interrogationAgentId}
        setInterrogationAgentId={setInterrogationAgentId}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <LoadingModal isOpen={isLoading} onCancel={handleCancelGeneration} />

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(p => p.filter(t => t.id !== toast.id))} />
        ))}
      </div>
       <TourWelcomeModal
        isOpen={showWelcomeModal}
        onStart={() => {
          setShowWelcomeModal(false);
          startTour();
        }}
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('tourCompleted', 'true');
        }}
      />
       <TourController
          setFormState={setFormState}
          setControls={setControls}
          setOutput={setOutput}
          handleClearForm={handleClearForm}
          handleUseSampleData={handleUseSampleData}
        />

      <ScrollToTop />
      <FeedbackButton />
    </div>
  );
};


const App: React.FC = () => (
  <TourProvider>
    <AppContent />
  </TourProvider>
);

export default App;