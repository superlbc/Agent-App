import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { AccountInfo } from "@azure/msal-browser";
import { GraphData } from '../types';
import { fetchUserByEmail } from '../utils/graphService';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AccountInfo | null;
  graphData: GraphData | null;
}

const getInitials = (name?: string): string => {
  if (!name) return 'LB';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Developer information - hardcoded email to fetch from Azure AD
const DEVELOPER_EMAIL = 'Luis.Bustos@momentumww.com';

// Fallback data if Azure AD fetch fails
const DEVELOPER_FALLBACK = {
  displayName: 'Luis Bustos',
  jobTitle: 'Director, AI & Technology Strategy and Architecture',
  mail: 'Luis.Bustos@momentumww.com',
  photoUrl: undefined,
  linkedin: 'https://www.linkedin.com/in/lbustos/'
};

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, user, graphData }) => {
  const { t } = useTranslation(['common']);
  const [developerData, setDeveloperData] = useState<GraphData | null>(null);
  const [isLoadingDeveloper, setIsLoadingDeveloper] = useState(false);

  // Refs for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch developer data from Azure AD when modal opens
  useEffect(() => {
    if (isOpen && !developerData && !isLoadingDeveloper) {
      setIsLoadingDeveloper(true);
      fetchUserByEmail(DEVELOPER_EMAIL)
        .then(data => {
          if (data) {
            setDeveloperData(data);
          }
        })
        .catch(error => {
          console.error('Failed to fetch developer data:', error);
        })
        .finally(() => {
          setIsLoadingDeveloper(false);
        });
    }
  }, [isOpen, developerData, isLoadingDeveloper]);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      const previouslyFocusedElement = document.activeElement as HTMLElement;

      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Return cleanup function
      return () => {
        document.body.style.overflow = '';
        // Restore focus to previously focused element
        previouslyFocusedElement?.focus();
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: if focused on first element, move to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focused on last element, move to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine if we have live data or should use fallback
  const hasLiveData = !isLoadingDeveloper && developerData !== null;
  const displayData = hasLiveData ? developerData : DEVELOPER_FALLBACK;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} ref={modalRef}>
        <div className="p-5">
          <div className="relative mb-6">
            <h2
              id="about-modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white text-center"
            >
              {t('common:about.title')}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close about"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          {/* App Info */}
          <div className="text-center mb-6">
            <Icon name="logo" className="h-16 w-16 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('common:about.appName')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common:about.version', { version: '1.0.0' })}</p>
          </div>

          <div className="space-y-4 text-sm">
            {/* Developer Card */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common:about.developedBy')}</h4>
              <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  {/* Developer Avatar - Live from Azure AD or fallback */}
                  {isLoadingDeveloper ? (
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                  ) : displayData.photoUrl ? (
                    <img
                      src={displayData.photoUrl}
                      alt="Developer profile"
                      className="h-12 w-12 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {getInitials(displayData.displayName)}
                    </div>
                  )}
                  {/* Developer Info - Live from Azure AD */}
                  <div className="flex-1 min-w-0">
                    {isLoadingDeveloper ? (
                      <>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-32" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
                      </>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {displayData.displayName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {displayData.jobTitle}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Actions Row */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Email - Only show if live data available */}
                  {hasLiveData && displayData.mail && (
                    <a
                      href={`mailto:${displayData.mail}`}
                      className="group relative flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Send email to Luis Bustos"
                      title="Email Luis"
                    >
                      <Icon name="email" className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      {/* Tooltip */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Email Luis
                      </span>
                    </a>
                  )}

                  {/* Teams - Only show if live data available */}
                  {hasLiveData && displayData.mail && (
                    <a
                      href={`https://teams.microsoft.com/l/chat/0/0?users=${displayData.mail}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Chat with Luis Bustos on Teams"
                      title="Chat on Teams"
                    >
                      <Icon name="teams-filled" className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      {/* Tooltip */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Chat on Teams
                      </span>
                    </a>
                  )}

                  {/* LinkedIn - Always show */}
                  <a
                    href="https://www.linkedin.com/in/lbustos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 hover:border-blue-700 dark:hover:border-blue-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="View Luis Bustos LinkedIn profile"
                    title="View LinkedIn Profile"
                  >
                    <Icon name="linkedin" className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-500 transition-colors" />
                    {/* Tooltip */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      View LinkedIn Profile
                    </span>
                  </a>
                </div>
              </Card>
            </div>

            {/* Organization Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-start gap-3">
                <Icon name="building" className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common:about.organization')}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{t('common:about.orgName')}</p>
                  <p className="text-gray-600 dark:text-gray-400">{t('common:about.initiative')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('common:about.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};
