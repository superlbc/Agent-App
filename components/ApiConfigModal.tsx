import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { telemetryService } from '../utils/telemetryService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  notesAgentId: string;
  setNotesAgentId: React.Dispatch<React.SetStateAction<string>>;
  interrogationAgentId: string;
  setInterrogationAgentId: React.Dispatch<React.SetStateAction<string>>;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  addToast,
  notesAgentId,
  setNotesAgentId,
  interrogationAgentId,
  setInterrogationAgentId,
}) => {
  const { t } = useTranslation(['common']);
  const [localNotesAgentId, setLocalNotesAgentId] = useState(notesAgentId);
  const [localInterrogationAgentId, setLocalInterrogationAgentId] = useState(interrogationAgentId);

  useEffect(() => {
    if (isOpen) {
      setLocalNotesAgentId(notesAgentId); // Sync form with stored config when opened
      setLocalInterrogationAgentId(interrogationAgentId);
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

    // Hard-coded defaults with env override capability
    const defaultNotesAgentId = (import.meta.env)?.DEFAULT_BOT_ID || 'b8460071-daee-4820-8198-5224fdc99e45';
    const defaultInterrogationAgentId = (import.meta.env)?.DEFAULT_BOT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044';

    // Telemetry: Track agent ID changes
    if (localNotesAgentId !== notesAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'agent1',
        oldBotIdHash: hashString(notesAgentId),
        newBotIdHash: hashString(localNotesAgentId),
        wasDefault: notesAgentId === defaultNotesAgentId
      });
    }
    if (localInterrogationAgentId !== interrogationAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'agent2',
        oldBotIdHash: hashString(interrogationAgentId),
        newBotIdHash: hashString(localInterrogationAgentId),
        wasDefault: interrogationAgentId === defaultInterrogationAgentId
      });
    }

    setNotesAgentId(localNotesAgentId);
    setInterrogationAgentId(localInterrogationAgentId);
    addToast(t('common:toasts.settingsSaved'), 'success');
    onClose();
  };

  const handleReset = () => {
    // Hard-coded defaults with env override capability
    const defaultNotesAgentId = (import.meta.env)?.DEFAULT_BOT_ID || 'b8460071-daee-4820-8198-5224fdc99e45';
    const defaultInterrogationAgentId = (import.meta.env)?.DEFAULT_BOT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044';

    // Telemetry: Track agent ID reset
    telemetryService.trackEvent('botIdChanged', {
      oldBotIdHash: 'custom',
      newBotIdHash: 'default',
      wasDefault: false,
      action: 'reset',
      agentType: 'both'
    });

    setLocalNotesAgentId(defaultNotesAgentId);
    setLocalInterrogationAgentId(defaultInterrogationAgentId);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">API Configuration</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close API configuration"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </header>

          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Override default agent IDs for testing. Leave empty to use defaults.
            </p>

            <Input
              id="agent1-id"
              label="Agent 1 ID"
              value={localNotesAgentId}
              onChange={e => setLocalNotesAgentId(e.target.value)}
              placeholder={(import.meta.env)?.DEFAULT_BOT_ID || 'b8460071-daee-4820-8198-5224fdc99e45'}
            />

            <Input
              id="agent2-id"
              label="Agent 2 ID"
              value={localInterrogationAgentId}
              onChange={e => setLocalInterrogationAgentId(e.target.value)}
              placeholder={(import.meta.env)?.DEFAULT_BOT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044'}
            />

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} className="grow">Save Settings</Button>
              <Button onClick={handleReset} variant="secondary">Reset</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
