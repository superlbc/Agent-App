import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { telemetryService } from '../utils/telemetryService';
import { useRole } from '../contexts/RoleContext';

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
  const { hasPermission } = useRole();
  const [isRendered, setIsRendered] = useState(false);
  const [localNotesAgentId, setLocalNotesAgentId] = useState(notesAgentId);
  const [localInterrogationAgentId, setLocalInterrogationAgentId] = useState(interrogationAgentId);

  // Check if user has permission to manage roles
  const canManageRoles = hasPermission('ADMIN_ROLE_MANAGE');

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

    // Hard-coded defaults with env override capability
    const defaultNotesAgentId = (import.meta.env)?.VITE_DEFAULT_NOTES_AGENT_ID || 'b8460071-daee-4820-8198-5224fdc99e45';
    const defaultInterrogationAgentId = (import.meta.env)?.VITE_DEFAULT_INTERROGATION_AGENT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044';

    // Telemetry: Track agent ID changes
    if (localNotesAgentId !== notesAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'notes',
        oldBotIdHash: hashString(notesAgentId),
        newBotIdHash: hashString(localNotesAgentId),
        wasDefault: notesAgentId === defaultNotesAgentId
      });
    }
    if (localInterrogationAgentId !== interrogationAgentId) {
      telemetryService.trackEvent('botIdChanged', {
        agentType: 'interrogation',
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
    const defaultNotesAgentId = (import.meta.env)?.VITE_DEFAULT_NOTES_AGENT_ID || 'b8460071-daee-4820-8198-5224fdc99e45';
    const defaultInterrogationAgentId = (import.meta.env)?.VITE_DEFAULT_INTERROGATION_AGENT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044';

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
                Override default agent IDs for testing. Leave empty to use defaults.
              </p>

              <Input
                id="notes-agent-id"
                label="Meeting Notes Agent ID"
                value={localNotesAgentId}
                onChange={e => setLocalNotesAgentId(e.target.value)}
                placeholder={(import.meta.env)?.VITE_DEFAULT_NOTES_AGENT_ID || 'b8460071-daee-4820-8198-5224fdc99e45'}
              />

              <Input
                id="interrogation-agent-id"
                label="Interrogation Agent ID"
                value={localInterrogationAgentId}
                onChange={e => setLocalInterrogationAgentId(e.target.value)}
                placeholder={(import.meta.env)?.VITE_DEFAULT_INTERROGATION_AGENT_ID || 'f8bf98dc-997c-4993-bbd6-02245b8b0044'}
              />

              <div className="flex items-center gap-2">
                <Button onClick={handleSave} className="grow">Save Settings</Button>
                <Button onClick={handleReset} variant="secondary">Reset</Button>
              </div>
            </section>

            {/* Role Management Section - Only visible to admins */}
            {canManageRoles && onOpenRoleManagement && (
              <section className="space-y-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Icon name="shield" className="h-5 w-5 text-blue-500" />
                  System Administration
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Manage roles, permissions, and user access control
                </p>

                <Button
                  onClick={() => {
                    onOpenRoleManagement();
                    onClose();
                  }}
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <Icon name="settings" className="h-5 w-5 mr-2" />
                  Role Management Dashboard
                </Button>

                <div className="text-xs text-gray-500 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Icon name="info" className="h-4 w-4 inline mr-1" />
                  You have administrator permissions to manage system roles and user access.
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};