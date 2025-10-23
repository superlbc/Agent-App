import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';

// Define the 'M' path from the logo as a constant for use in the progress bar.
const M_PATH_DATA = "M402.56,301.83c-3.22-2.89-9-5.47-12.91-4.62-12.69,2.75-16,1.28-14.1-11.52,2.01-13.51,6.45-26.64,9.13-40.08,3.5-17.57,8.61-35.25,8.9-52.95.48-28.88-21.55-45.22-50.01-40.75-21.67,3.41-36.62,15.81-49.55,35.92-.17-.82-.35-1.62-.54-2.41-3.21-24.06-23.74-37.15-49.58-33.09-21.67,3.41-36.62,15.81-49.55,35.92-4.35-21.07-15.29-32.34-34.85-35.42-26.81-4.22-49.73,6.08-65.19,31.29-2.16,3.53-3.01,11.13-.88,13.27,3.4,3.4,10.17,5.86,14.89,5.06,11.56-1.96,14.24-.67,13.73,10.89-.11,2.55-.66,5.09-1.14,7.61-6.8,35.81-13.6,71.63-20.46,107.43-2.9,15.12-1.29,17.15,14.61,17.27,12.48.09,24.99-.53,37.42.18,10.3.6,15.48-4.12,17.75-14.02,5.76-25.1,11.51-50.21,17.27-75.31,2.98-13,6.11-26.34,13.68-37.32,3.3-4.79,9.93-10.21,15.45-4.96,2.49,2.36,3.4,6.01,3.23,9.44-.02.43-.07.87-.12,1.3-6.52,34.33-13.04,68.67-19.62,102.99-2.9,15.12-1.29,17.15,14.61,17.27,12.48.09,24.99-.53,37.42.18,10.3.6,15.48-4.12,17.75-14.02,5.76-25.1,11.51-50.21,17.27-75.31,2.98-13,6.11-26.34,13.68-37.32,3.3-4.79,9.93-10.21,15.45-4.96,2.49,2.36,3.4,6.01,3.23,9.44-.17,3.43-1.3,6.73-2.35,9.99-7.9,24.62-13.44,52.02-14.45,77.89-.84,21.76,11.57,33.76,33.24,37.15,24.05,3.75,56.98-13.08,68.22-35.58,1.41-2.82.53-8.91-1.65-10.87Z";

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  messages?: { progress: number; text: string }[];
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title,
  messages
}) => {
  const { t } = useTranslation(['common']);

  const defaultMessages = useMemo(() => [
    { progress: 0, text: t('common:loading.steps.connecting') },
    { progress: 15, text: t('common:loading.steps.analyzing') },
    { progress: 30, text: t('common:loading.steps.extracting') },
    { progress: 50, text: t('common:loading.steps.identifying') },
    { progress: 70, text: t('common:loading.steps.applying') },
    { progress: 85, text: t('common:loading.steps.formatting') },
    { progress: 95, text: t('common:loading.steps.polishing') },
  ], [t]);

  const displayTitle = title || t('common:loading.title');
  const displayMessages = messages || defaultMessages;
  const [currentMessage, setCurrentMessage] = useState(displayMessages[0].text);
  const [progress, setProgress] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // This effect handles the component's mount/unmount transition for animations.
    if (isOpen) {
      setIsRendered(true);
    } else {
      setProgress(100); // Jump to 100% on close for a satisfying finish
      const timer = setTimeout(() => setIsRendered(false), 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    // This effect handles the animation logic itself.
    if (!isOpen || !isRendered) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    // Reset state for a new animation run
    setProgress(0);
    setCurrentMessage(displayMessages[0].text);
    
    let startTime: number | null = null;
    const FAST_PHASE_DURATION = 36000; // 36 seconds
    const FAST_PHASE_TARGET = 90;      // to 90%
    const SLOW_CRAWL_RATE = 0.017 / 3; // % per second after fast phase

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      let currentProgress;

      if (elapsed < FAST_PHASE_DURATION) {
        // Fast phase: ease-out to the target percentage
        const progressRatio = elapsed / FAST_PHASE_DURATION;
        const easedProgressRatio = 1 - Math.pow(1 - progressRatio, 3); // easeOutCubic
        currentProgress = easedProgressRatio * FAST_PHASE_TARGET;
      } else {
        // Slow crawl phase: indefinitely creep towards 99%
        const timeInCrawl = elapsed - FAST_PHASE_DURATION;
        const crawlProgress = (timeInCrawl / 1000) * SLOW_CRAWL_RATE;
        currentProgress = FAST_PHASE_TARGET + crawlProgress;
      }
      
      // Cap the progress at a high value to avoid reaching 100% prematurely.
      const cappedProgress = Math.min(currentProgress, 99);
      setProgress(cappedProgress);
      
      // Update the message based on progress
      setCurrentMessage(prevMessage => {
        const newMessage = [...displayMessages].reverse().find(m => cappedProgress >= m.progress);
        return (newMessage && newMessage.text !== prevMessage) ? newMessage.text : prevMessage;
      });
      
      // Continue animating as long as the modal is open
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isRendered, displayMessages]);
  
  if (!isRendered) return null;

  const progressHeight = 500 * (progress / 100);
  const yPosition = 500 - progressHeight;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      aria-modal="true"
      role="dialog"
    >
        <Card className="p-8 text-center w-full max-w-sm relative overflow-hidden">
            <div className="flex flex-col items-center justify-center min-h-[220px]">
                <div className="relative mx-auto w-28 h-28">
                    <svg viewBox="0 0 500 500" className="w-full h-full">
                        <defs>
                            <clipPath id="logo-progress-clip">
                                <rect x="0" y={yPosition} width="500" height={progressHeight} />
                            </clipPath>
                        </defs>
                        
                        {/* Base "empty" layer */}
                        <circle cx="250" cy="250" r="250" className="fill-slate-200 dark:fill-slate-800" />
                        <path d={M_PATH_DATA} className="fill-slate-300 dark:fill-slate-600" />

                        {/* Filled layer (clipped) */}
                        <g clipPath="url(#logo-progress-clip)">
                            <circle cx="250" cy="250" r="250" className="fill-slate-900 dark:fill-slate-50" />
                            <path d={M_PATH_DATA} className="fill-slate-50 dark:fill-slate-900" />
                        </g>
                    </svg>
                </div>
                <p className="mt-6 text-lg font-semibold text-slate-700 dark:text-slate-200">{displayTitle}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{currentMessage}</p>
            </div>
        </Card>
    </div>
  );
};
