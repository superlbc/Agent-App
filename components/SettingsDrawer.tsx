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
  botId: string;
  setBotId: React.Dispatch<React.SetStateAction<string>>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  addToast,
  botId,
  setBotId
}) => {
  const { t } = useTranslation(['common']);
  const [isRendered, setIsRendered] = useState(false);
  const [localBotId, setLocalBotId] = useState(botId);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setLocalBotId(botId); // Sync form with stored config when opened

      // Telemetry: Track settings opened
      telemetryService.trackEvent('settingsOpened', {});
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, botId]);
  
  const handleSave = () => {
    // Telemetry: Track bot ID change if value differs
    if (localBotId !== botId) {
      // Hash the bot IDs for privacy
      const hashString = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
      };

      telemetryService.trackEvent('botIdChanged', {
        oldBotIdHash: hashString(botId),
        newBotIdHash: hashString(localBotId),
        wasDefault: botId === (import.meta.env)?.DEFAULT_BOT_ID
      });
    }

    setBotId(localBotId);
    addToast(t('common:toasts.settingsSaved'), 'success');
    onClose();
  };

  const handleReset = () => {
    const defaultBotId = (import.meta.env)?.DEFAULT_BOT_ID || '';

    // Telemetry: Track bot ID reset
    telemetryService.trackEvent('botIdChanged', {
      oldBotIdHash: 'custom',
      newBotIdHash: 'default',
      wasDefault: false,
      action: 'reset'
    });

    setBotId(defaultBotId);
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
              <Input id="bot-id" label="Bot ID" value={localBotId} onChange={e => setLocalBotId(e.target.value)} />
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