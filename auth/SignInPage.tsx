import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';

interface SignInPageProps {
  onLogin: () => void;
  popupBlocked: boolean;
  onOpenInNewTab: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onLogin, popupBlocked, onOpenInNewTab }) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md p-8 text-center relative">
        <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded bg-blue-500 text-white">Beta</span>
        <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />
        <div className="mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('common:auth.signIn.welcomeTo')}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('common:auth.signIn.appName')}
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">
            {t('common:auth.signIn.tagline')}
          </p>
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-400">
          {t('common:auth.signIn.instruction')}
        </p>

        {!popupBlocked && (
          <Button size="lg" className="w-full mt-8" onClick={onLogin}>
            {t('common:auth.signIn.button')}
          </Button>
        )}

        {popupBlocked && (
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-left">
            <h2 className="font-semibold text-amber-800 dark:text-amber-200">
              {t('common:auth.signIn.popupBlocked.title')}
            </h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {t('common:auth.signIn.popupBlocked.message')}
            </p>
            <Button size="md" variant="outline" className="w-full mt-4" onClick={onOpenInNewTab}>
              <Icon name="external-link" className="h-4 w-4 mr-2"/>
              {t('common:auth.signIn.popupBlocked.button')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};