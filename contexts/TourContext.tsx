import React, { createContext, useContext, useState, useCallback } from 'react';
import { telemetryService } from '../utils/telemetryService';

interface TourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    // Telemetry: Track tour started
    telemetryService.trackEvent('tourStarted', {});

    setCurrentStepIndex(0);
    setIsTourActive(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    localStorage.setItem('tourCompleted', 'true');
    document.body.style.overflow = '';
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const value = {
    isTourActive,
    currentStepIndex,
    startTour,
    stopTour,
    nextStep,
    prevStep,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTourContext = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
};
