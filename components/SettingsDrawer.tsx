import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { telemetryService } from '../utils/telemetryService';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  notesAgentId: string;
  setNotesAgentId: React.Dispatch<React.SetStateAction<string>>;
  interrogationAgentId: string;
  setInterrogationAgentId: React.Dispatch<React.SetStateAction<string>>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  addToast,
  notesAgentId,
  setNotesAgentId,
  interrogationAgentId,
  setInterrogationAgentId
}) => {
  const { t } = useTranslation(['common']);
  const [isRendered, setIsRendered] = useState(false);
  const [localNotesAgentId, setLocalNotesAgentId] = useState(notesAgentId);
  const [localInterrogationAgentId, setLocalInterrogationAgentId] = useState(interrogationAgentId);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setLocalNotesAgentId(notesAgentId); // Sync form with stored config when opened
      setLocalInterrogationAgentId(interrogationAgentId);

      // Telemetry: DISABLED - settingsOpened too frequent, low analytical value
      // telemetryService.trackEvent('settingsOpened', {});
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, notesAgentId, interrogationAgentId]);
  
  const handleSave = () => {
    // Helper to hash agent IDs for privacy
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    };

    // Telemetry: Track agent ID changes
    if (localNotesAgentId !== notesAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'notes',
        oldBotIdHash: hashString(notesAgentId),
        newBotIdHash: hashString(localNotesAgentId),
        wasDefault: notesAgentId === (import.meta.env)?.DEFAULT_NOTES_AGENT_ID
      });
    }
    if (localInterrogationAgentId !== interrogationAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'interrogation',
        oldBotIdHash: hashString(interrogationAgentId),
        newBotIdHash: hashString(localInterrogationAgentId),
        wasDefault: interrogationAgentId === (import.meta.env)?.DEFAULT_INTERROGATION_AGENT_ID
      });
    }

    setNotesAgentId(localNotesAgentId);
    setInterrogationAgentId(localInterrogationAgentId);
    addToast(t('common:toasts.settingsSaved'), 'success');
    onClose();
  };

  const handleReset = () => {
    const defaultNotesAgentId = (import.meta.env)?.DEFAULT_NOTES_AGENT_ID || '';
    const defaultInterrogationAgentId = (import.meta.env)?.DEFAULT_INTERROGATION_AGENT_ID || '';

    // Telemetry: Track agent ID reset
    telemetryService.trackEvent('botIdChanged', {
      oldBotIdHash: 'custom',
      newBotIdHash: 'default',
      wasDefault: false,
      action: 'reset',
      agentType: 'both'
    });

    setNotesAgentId(defaultNotesAgentId);
    setInterrogationAgentId(defaultInterrogationAgentId);
    addToast(t('common:toasts.botIdReset'), 'success');
    onClose();
  };

  if (!isRendered) return null;
  
  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'bg-black/50' : 'bg-transparent'} transition-colors duration-300`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl transform ${isOpen ? 'animate-slide-in' : 'animate-slide-out'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          <header className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close settings"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </header>
          
          <div className="flex-grow p-6 overflow-y-auto">
            <section className="space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">API Configuration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Override default agent IDs for testing. Leave empty to use defaults.
              </p>

              <Input
                id="notes-agent-id"
                label="Meeting Notes Agent ID"
                value={localNotesAgentId}
                onChange={e => setLocalNotesAgentId(e.target.value)}
                placeholder={(import.meta.env)?.DEFAULT_NOTES_AGENT_ID || ''}
              />

              <Input
                id="interrogation-agent-id"
                label="Interrogation Agent ID"
                value={localInterrogationAgentId}
                onChange={e => setLocalInterrogationAgentId(e.target.value)}
                placeholder={(import.meta.env)?.DEFAULT_INTERROGATION_AGENT_ID || ''}
              />

              <div className="flex items-center gap-2">
                <Button onClick={handleSave} className="grow">Save Settings</Button>
                <Button onClick={handleReset} variant="secondary">Reset</Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};