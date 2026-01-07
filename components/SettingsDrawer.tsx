import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.tsx';
import { Button } from './ui/Button.tsx';
import { telemetryService } from '../utils/telemetryService';
import { ApiConfigModal } from './ApiConfigModal.tsx';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  notesAgentId: string;
  setNotesAgentId: React.Dispatch<React.SetStateAction<string>>;
  interrogationAgentId: string;
  setInterrogationAgentId: React.Dispatch<React.SetStateAction<string>>;
  onOpenRoleManagement?: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  addToast,
  notesAgentId,
  setNotesAgentId,
  interrogationAgentId,
  setInterrogationAgentId,
  onOpenRoleManagement
}) => {
  const { t } = useTranslation(['common']);
  const [isRendered, setIsRendered] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);

      // Telemetry: DISABLED - settingsOpened too frequent, low analytical value
      // telemetryService.trackEvent('settingsOpened', {});
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;
  
  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'bg-black/50' : 'bg-transparent'} transition-colors duration-300`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl transform ${isOpen ? 'animate-slide-in' : 'animate-slide-out'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close settings"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </header>
          
          <div className="flex-grow p-6 overflow-y-auto">
            <section className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">API Configuration</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Configure agent IDs for API integration and testing.
              </p>

              <Button
                onClick={() => setIsApiConfigOpen(true)}
                variant="secondary"
                className="w-full justify-start"
              >
                <Icon name="settings" className="h-5 w-5 mr-2" />
                Configure Settings
              </Button>
            </section>
          </div>
        </div>
      </div>

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        addToast={addToast}
        notesAgentId={notesAgentId}
        setNotesAgentId={setNotesAgentId}
        interrogationAgentId={interrogationAgentId}
        setInterrogationAgentId={setInterrogationAgentId}
      />
    </div>
  );
};