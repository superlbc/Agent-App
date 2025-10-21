import React, { useState, useEffect } from 'react';
import { Icon } from './ui/Icon.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';

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
  const [isRendered, setIsRendered] = useState(false);
  const [localBotId, setLocalBotId] = useState(botId);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setLocalBotId(botId); // Sync form with stored config when opened
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, botId]);
  
  const handleSave = () => {
    setBotId(localBotId);
    addToast('Settings saved successfully!', 'success');
    onClose();
  };
  
  const handleReset = () => {
    const defaultBotId = (import.meta.env)?.DEFAULT_BOT_ID || '';
    setBotId(defaultBotId);
    addToast('Bot ID has been reset to default.', 'success');
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
          
          <div className="flex-grow p-6 overflow-y-auto space-y-8">
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