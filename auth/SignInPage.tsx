import React from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';

interface SignInPageProps {
  onLogin: () => void;
  popupBlocked: boolean;
  onOpenInNewTab: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onLogin, popupBlocked, onOpenInNewTab }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md p-8 text-center">
        <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome to Meeting Notes Generator
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500 text-white">Beta</span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
            Drive consistency and impact in every meeting.
          </p>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          To continue, please sign in with your company account. This ensures secure access to the application.
        </p>

        {!popupBlocked && (
          <Button size="lg" className="w-full mt-8" onClick={onLogin}>
            Sign In
          </Button>
        )}
        
        {popupBlocked && (
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-left">
            <h2 className="font-semibold text-amber-800 dark:text-amber-200">
              Having trouble signing in?
            </h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              It looks like the sign-in pop-up was blocked. For the best experience, please open this tool in a new tab to complete authentication.
            </p>
            <Button size="md" variant="outline" className="w-full mt-4" onClick={onOpenInNewTab}>
              <Icon name="external-link" className="h-4 w-4 mr-2"/>
              Open in New Tab to Sign In
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};