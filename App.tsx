import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ChatInterface } from './components/chat/ChatInterface';
import { HelpModal } from './components/HelpModal';
import { Toast } from './components/ui/Toast';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { Icon } from './components/ui/Icon';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ToastState, ApiConfig } from './types';
import { useAuth } from './contexts/AuthContext';
import { telemetryService } from './utils/telemetryService';
import { getBrowserContext } from './utils/browserContext';
import { FeedbackButton } from './components/FeedbackButton';
import { useVersionCheck } from './hooks/useVersionCheck';
import { VersionUpdateBanner } from './components/ui/VersionUpdateBanner';
import { DEFAULT_API_CONFIG } from './constants';
import { CollapsibleNavigation } from './components/CollapsibleNavigation';

type SimplifiedSection = 'chat' | 'settings';

const AppContent: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [currentSection, setCurrentSection] = useLocalStorage<SimplifiedSection>(
    'currentSection',
    'chat'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { user, graphData } = useAuth();

  // API Configuration (preserved for chat integration)
  const [notesAgentId, setNotesAgentId] = useLocalStorage<string>(
    'notesAgentId',
    DEFAULT_API_CONFIG.notesAgentId
  );
  const [interrogationAgentId, setInterrogationAgentId] = useLocalStorage<string>(
    'interrogationAgentId',
    DEFAULT_API_CONFIG.interrogationAgentId
  );

  const apiConfig: ApiConfig = {
    hostname: DEFAULT_API_CONFIG.hostname,
    clientId: DEFAULT_API_CONFIG.clientId,
    clientSecret: DEFAULT_API_CONFIG.clientSecret,
    notesAgentId: notesAgentId,
    interrogationAgentId: interrogationAgentId,
  };

  // Version check for automatic update detection
  const {
    updateAvailable,
    currentVersion,
    serverVersion,
    dismissUpdate,
  } = useVersionCheck();

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Track user login (once per session)
  useEffect(() => {
    if (user && !sessionStorage.getItem('loginTracked')) {
      const browserContext = getBrowserContext(isDarkMode);
      telemetryService.trackEvent('userLogin', {
        userName: user.name || 'Unknown',
        userEmail: user.username || 'Unknown',
        ...browserContext,
      });
      sessionStorage.setItem('loginTracked', 'true');
    }
  }, [user, isDarkMode]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // ============================================================================
  // CHAT INTERFACE HANDLERS
  // ============================================================================

  const handleSendMessage = async (message: string, conversationId: string): Promise<string> => {
    // TODO: Integrate with copilotService.sendMessage()
    // For now, return a mock response
    console.log('Sending message:', message, 'Conversation:', conversationId);
    return `mock-message-${Date.now()}`;
  };

  const handlePollResponse = async (conversationId: string, messageId: string): Promise<any> => {
    // TODO: Integrate with copilotService.pollActivities()
    // For now, return a mock bot response
    console.log('Polling for response:', conversationId, messageId);
    return {
      role: 'bot',
      content: 'This is a placeholder response. The Copilot Studio integration will be completed in Phase 4.',
      timestamp: new Date(),
    };
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    telemetryService.trackEvent('userLogout', {
      userName: user?.name || 'Unknown',
      userEmail: user?.username || 'Unknown',
    });
    // Logout handled by AuthContext
  };

  const handleHelpOpen = () => {
    setIsHelpOpen(true);
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Clear local storage data
    localStorage.clear();
    sessionStorage.clear();
    addToast('All data has been reset', 'success');
    window.location.reload();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Version Update Banner */}
      {updateAvailable && currentVersion && serverVersion && (
        <VersionUpdateBanner
          currentVersion={currentVersion.version}
          serverVersion={serverVersion.version}
          onDismiss={dismissUpdate}
        />
      )}

      {/* Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleDarkModeToggle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={handleHelpOpen}
        onReset={handleResetData}
      />

      {/* Mobile Menu Button (Hamburger) - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Open navigation menu"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <CollapsibleNavigation
          currentSection={currentSection as any}
          onSectionChange={(section) => setCurrentSection(section as SimplifiedSection)}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Chat Interface Section */}
          {currentSection === 'chat' && (
            <div className="h-full overflow-hidden">
              <ChatInterface
                botId={DEFAULT_API_CONFIG.notesAgentId || 'copilot-bot'}
                onSendMessage={handleSendMessage}
                onPollResponse={handlePollResponse}
                userName={graphData?.displayName || user?.name || 'You'}
                userPhotoUrl={graphData?.photoUrl}
              />
            </div>
          )}

          {/* Settings Section (placeholder) */}
          {currentSection === 'settings' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Application Settings
                </h1>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Settings panel content coming soon. For now, use the settings icon in the header to access agent configuration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        addToast={addToast}
        notesAgentId={notesAgentId}
        setNotesAgentId={setNotesAgentId}
        interrogationAgentId={interrogationAgentId}
        setInterrogationAgentId={setInterrogationAgentId}
        onOpenRoleManagement={() => {
          addToast('Role Management feature coming soon', 'success');
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Floating Components */}
      <FeedbackButton />
      <ScrollToTop />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Reset All Data?"
        message="Are you sure you want to reset all data? This will clear all stored preferences and reload the application. This action cannot be undone."
        confirmText="Reset All Data"
        variant="danger"
      />
    </div>
  );
};

export default AppContent;
