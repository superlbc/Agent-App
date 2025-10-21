import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { HelpModal } from './components/HelpModal';
import { LoadingModal } from './components/ui/LoadingModal';
import { Toast } from './components/ui/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateNotes } from './services/apiService';
import { Controls, Payload, AgentResponse, FormState, ToastState, ApiConfig } from './types';
import { SAMPLE_DATA } from './constants';
import { Button } from './components/ui/Button';
import { Icon } from './components/ui/Icon';
import { TourProvider, useTourContext } from './contexts/TourContext';
import { TourController } from './components/tour/TourController';
import { TourWelcomeModal } from './components/tour/TourWelcomeModal';

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
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', 
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [formState, setFormState] = useLocalStorage<FormState>('formState', {
    title: '',
    agenda: '',
    transcript: '',
    tags: ["Internal only"],
  });
  
  const [botId, setBotId] = useLocalStorage<string>('botId', (import.meta.env)?.DEFAULT_BOT_ID || '');

  const apiConfig: ApiConfig = {
    hostname: 'https://interact.interpublic.com',
    clientId: (import.meta.env)?.CLIENT_ID || '',
    clientSecret: (import.meta.env)?.CLIENT_SECRET || '',
    botId: botId,
  };

  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);

  const [output, setOutput] = useState<AgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const { startTour, isTourActive } = useTourContext();

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

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const handleGenerate = useCallback(async (currentFormState: FormState, currentControls: Controls) => {
    if (!apiConfig.clientId || !apiConfig.clientSecret || !apiConfig.botId) {
        addToast('API configuration is missing. Check settings and environment variables.', 'error');
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: Payload = {
        meeting_title: currentFormState.title,
        agenda: currentFormState.agenda.split('\n').filter(line => line.trim() !== ''),
        transcript: currentFormState.transcript,
        controls: currentControls,
      };
      
      const response = await generateNotes(payload, apiConfig);
      setOutput(response);
      setHasGenerated(true);
      if(hasGenerated) {
        addToast('Preview updated successfully', 'success');
      } else {
        addToast('Notes generated successfully', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setOutput(null);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [hasGenerated, apiConfig]);

  const handleGenerateClick = () => {
    handleGenerate(formState, controls);
  };

  const handleClearForm = useCallback(() => {
    setFormState({ title: '', agenda: '', transcript: '', tags: [] });
    setOutput(null);
    setHasGenerated(false);
    // Do not show toast when clearing form programmatically for the tour
  }, [setFormState]);

  const handleUseSampleData = useCallback(() => {
    setFormState(SAMPLE_DATA);
    // Do not show toast when using sample data programmatically for the tour
  }, [setFormState]);
  
  const handleReplayTour = () => {
    setShowWelcomeModal(true);
  };

  return (
    <div className="min-h-screen font-sans">
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReplayTour={handleReplayTour}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-[500px] flex-shrink-0">
            <div id="generate-button-wrapper" className="sticky top-24 z-30 mb-6">
                <Button id="generate-button" onClick={handleGenerateClick} disabled={isLoading || !formState.transcript} size="lg" className="w-full text-base shadow-lg dark:shadow-primary/20">
                {isLoading ? (
                    <>
                        <Icon name="loader" className="h-5 w-5 mr-2 animate-spin"/>
                        Generating...
                    </>
                ) : (
                    <>
                        <Icon name="sparkles" className="h-5 w-5 mr-2"/>
                        Generate Notes
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
              onClearForm={() => { handleClearForm(); addToast('Form cleared', 'success'); }}
              onUseSampleData={() => { handleUseSampleData(); addToast('Sample data loaded', 'success'); }}
              isTourActive={isTourActive}
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
            />
          </div>
        </div>
      </main>
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        addToast={addToast}
        botId={botId}
        setBotId={setBotId}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <LoadingModal isOpen={isLoading} />

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
    </div>
  );
};


const App: React.FC = () => (
  <TourProvider>
    <AppContent />
  </TourProvider>
);

export default App;