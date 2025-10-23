import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface TourWelcomeModalProps {
  isOpen: boolean;
  onStart: () => void;
  onClose: () => void;
}

export const TourWelcomeModal: React.FC<TourWelcomeModalProps> = ({ isOpen, onStart, onClose }) => {
  const { t } = useTranslation(['tour']);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
        <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />
        <h2 className="mt-6 text-2xl font-bold">{t('tour:welcome.title')}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t('tour:welcome.description')}
        </p>
        <div className="mt-8 flex gap-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>{t('tour:welcome.buttons.skip')}</Button>
          <Button className="w-full" onClick={onStart}>{t('tour:welcome.buttons.start')}</Button>
        </div>
      </Card>
    </div>
  );
};
