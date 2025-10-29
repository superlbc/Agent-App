import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';

// Define the 'M' path from the logo as a constant for use in the progress bar.
const M_PATH_DATA = "M3.41382 163.24 C2.72402 167.486 5.02752 171.536 9.46582 171.58 C24.1065 171.727 39.7055 171.727 55.4205 171.58 C60.6465 170.93 61.8355 167.984 62.8355 163.4 C68.8725 135.709 72.6955 106.745 78.0415 78.7967 C79.0045 73.7637 79.8065 67.5537 81.2815 62.7557 C84.9045 50.9727 102.6 45.1927 110.839 55.4637 C115.057 60.7227 113.691 66.8017 112.74 72.9477 C107.984 103.707 100.993 134.177 96.0925 164.922 C96.1215 167.343 97.3335 169.395 99.2645 170.598 C100.109 171.124 101.094 171.377 102.088 171.391 C117.762 171.601 133.626 171.891 149.266 171.252 C150.203 171.214 151.128 170.958 151.916 170.449 C153.518 169.414 154.91 167.672 155.284 165.963 C160.881 136.781 165.476 107.41 171.046 78.2307 C171.964 73.4237 172.734 67.5877 174.278 63.0317 C180.264 45.3787 209.104 44.7607 206.681 67.9297 C204.687 86.9817 198.89 107.289 195.992 126.427 C191.655 155.064 207.695 177.152 238.013 174.119 C252.539 172.666 269.798 164.172 279.708 153.434 C282.141 150.798 281.046 149.358 279.889 146.426 C278.315 142.434 276.217 138.554 274.463 134.635 C274.173 134.333 273.509 134 273.111 133.927 C271.006 133.544 266.372 135.749 263.74 136.048 C261.223 136.335 259.171 136.285 257.328 134.395 C254.194 131.18 255.775 126.363 256.394 122.464 C260.386 97.3387 267.837 70.2607 268.5 44.9687 C269.198 18.3397 253.06 0.490692 228.364 0.0116921 C207.544 -0.392308 191.994 9.70869 177.367 24.8187 C167.579 12.3577 162.367 7.42869 147.962 2.59869 C125.112 -5.06231 98.8455 7.04169 84.2215 24.8187 L80.2695 18.8307 C65.1175 -9.06231 19.1365 -0.955308 1.81662 20.7187 C0.070517 22.9047 -0.457283 23.5037 0.409517 26.3857 C0.908417 28.0457 3.56302 34.3247 4.45762 35.6647 C6.09552 38.1187 9.28452 36.4507 11.533 36.1067 C19.4245 34.8987 24.7225 38.6727 24.3725 46.9627 L3.41382 163.24";

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  messages?: { progress: number; text: string }[];
  onCancel?: () => void;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title,
  messages,
  onCancel
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

  const progressHeight = 450.41 * (progress / 100);
  const yPosition = 450.41 - progressHeight;

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
                    <svg viewBox="0 0 450.41 450.41" className="w-full h-full">
                        <defs>
                            <clipPath id="logo-progress-clip">
                                <rect x="0" y={yPosition} width="450.41" height={progressHeight} />
                            </clipPath>
                        </defs>

                        {/* Base "empty" layer */}
                        <path d="M450.41 225.205 C450.41 349.583 349.583 450.41 225.205 450.41 C100.828 450.41 0 349.583 0 225.205 C0 100.828 100.828 0 225.205 0 C349.583 0 450.41 100.828 450.41 225.205" className="fill-slate-200 dark:fill-slate-800" />
                        <path d={M_PATH_DATA} transform="translate(84.6225, 138.006)" className="fill-slate-300 dark:fill-slate-600" />

                        {/* Filled layer (clipped) */}
                        <g clipPath="url(#logo-progress-clip)">
                            <path d="M450.41 225.205 C450.41 349.583 349.583 450.41 225.205 450.41 C100.828 450.41 0 349.583 0 225.205 C0 100.828 100.828 0 225.205 0 C349.583 0 450.41 100.828 450.41 225.205" className="fill-black dark:fill-white" />
                            <path d={M_PATH_DATA} transform="translate(84.6225, 138.006)" className="fill-white dark:fill-black" />
                        </g>
                    </svg>
                </div>
                <p className="mt-6 text-lg font-semibold text-slate-700 dark:text-slate-200">{displayTitle}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{currentMessage}</p>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="mt-6 px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 border border-slate-300 dark:border-slate-600"
                    aria-label={t('common:buttons.cancel')}
                  >
                    {t('common:buttons.cancel')}
                  </button>
                )}
            </div>
        </Card>
    </div>
  );
};
