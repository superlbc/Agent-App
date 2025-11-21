import React, { useLayoutEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { telemetryService } from '../../utils/telemetryService';

interface TourStepProps {
  step: {
    selector: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
  };
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

export const TourStep: React.FC<TourStepProps> = ({
  step,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onStop,
  currentStepIndex,
  totalSteps
}) => {
  const { t } = useTranslation(['tour']);
  const { selector, title, content, placement = 'bottom' } = step;
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const targetElement = document.querySelector(selector);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      const updateRect = () => {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      };
      
      const timeoutId = setTimeout(updateRect, 350); // Delay to allow for scroll
      
      window.addEventListener('resize', updateRect);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateRect);
      };
    } else {
        console.warn(`Tour target not found: ${selector}`);
        // If target is not found, we can either stop the tour or try to advance.
        // For now, let's stop it to avoid a broken UI state.
        onStop();
    }
  }, [selector, onStop]);
  
  const getPopoverPosition = (): React.CSSProperties => {
    if (!targetRect || !popoverRef.current) return { visibility: 'hidden' };

    const popoverHeight = popoverRef.current.offsetHeight;
    const popoverWidth = popoverRef.current.offsetWidth;
    const spacing = 12;

    let styles: React.CSSProperties = {};

    switch (placement) {
      case 'top':
        styles = {
          top: targetRect.top - popoverHeight - spacing,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
        };
        break;
      case 'bottom':
        styles = {
          top: targetRect.bottom + spacing,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2,
        };
        break;
      case 'left':
        styles = {
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
          left: targetRect.left - popoverWidth - spacing,
        };
        break;
      case 'right':
        styles = {
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
          left: targetRect.right + spacing,
        };
        break;
    }

    // Boundary checks to keep popover on screen
    if (styles.left && (styles.left as number) < spacing) {
      styles.left = spacing;
    }
    if (styles.top && (styles.top as number) < spacing) {
      styles.top = spacing;
    }
    if (styles.left && (styles.left as number) + popoverWidth > window.innerWidth - spacing) {
      styles.left = window.innerWidth - popoverWidth - spacing;
    }
    if (styles.top && (styles.top as number) + popoverHeight > window.innerHeight - spacing) {
      styles.top = window.innerHeight - popoverHeight - spacing;
    }

    return styles;
  };

  return (
    <>
      {targetRect && (
        <div
          id="tour-highlight"
          style={{
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            top: targetRect.top - 4,
            left: targetRect.left - 4,
          }}
        ></div>
      )}
      <div
        ref={popoverRef}
        className="tour-popover"
        style={getPopoverPosition()}
      >
        <Card className="p-4 shadow-2xl">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{title}</h3>
            <button
              onClick={() => {
                // Telemetry: Track tour dismissed via close (X) button
                telemetryService.trackEvent('tourDismissed', {
                  stepIndex: currentStepIndex,
                  totalSteps: totalSteps
                });
                onStop();
              }}
              className="-mt-2 -mr-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close tutorial"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 my-3" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}>
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
          
          <div className="flex justify-between items-center mt-4">
            <Button variant="secondary" size="sm" onClick={() => {
              // Telemetry: Track tour dismissed via "End Tour" button
              telemetryService.trackEvent('tourDismissed', {
                stepIndex: currentStepIndex,
                totalSteps: totalSteps
              });
              onStop();
            }}>{t('tour:navigation.skip')}</Button>
            <div className="flex gap-2">
              {!isFirst && <Button variant="outline" size="sm" onClick={onPrev}>{t('tour:navigation.back')}</Button>}
              <Button size="sm" onClick={() => {
                if (isLast) {
                  // Telemetry: Track tour completed via "Finish" button
                  telemetryService.trackEvent('tourCompleted', {
                    totalSteps: totalSteps
                  });
                  onStop();
                } else {
                  onNext();
                }
              }}>
                {isLast ? t('tour:navigation.finish') : t('tour:navigation.next')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};