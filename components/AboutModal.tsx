import React, { useState, useEffect } from 'react';
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

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, user, graphData }) => {
  const { t } = useTranslation(['common']);
  const [developerData, setDeveloperData] = useState<GraphData | null>(null);
  const [isLoadingDeveloper, setIsLoadingDeveloper] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="relative mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white text-center">{t('common:about.title')}</h2>
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close about"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          {/* App Info */}
          <div className="text-center mb-6">
            <Icon name="logo" className="h-16 w-16 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('common:about.appName')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('common:about.version', { version: '1.0.0' })}</p>
          </div>

          <div className="space-y-4 text-sm">
            {/* Developer Card */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">{t('common:about.developedBy')}</h4>
              <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {/* Developer Avatar - Live from Azure AD */}
                  {isLoadingDeveloper ? (
                    <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                  ) : developerData?.photoUrl ? (
                    <img
                      src={developerData.photoUrl}
                      alt="Developer profile"
                      className="h-12 w-12 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {getInitials(developerData?.displayName)}
                    </div>
                  )}
                  {/* Developer Info - Live from Azure AD */}
                  <div className="flex-1 min-w-0">
                    {isLoadingDeveloper ? (
                      <>
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1 w-32" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-48" />
                      </>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
                          {developerData?.displayName || 'Luis Bustos'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {developerData?.jobTitle || 'Director, AI & Technology Strategy and Architecture'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Organization Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start gap-3">
                <Icon name="building" className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common:about.organization')}</h4>
                  <p className="text-slate-600 dark:text-slate-400">{t('common:about.orgName')}</p>
                  <p className="text-slate-600 dark:text-slate-400">{t('common:about.initiative')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('common:about.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};
