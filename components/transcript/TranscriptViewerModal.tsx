/**
 * TranscriptViewerModal - Full-screen modal for viewing imported meeting transcripts
 * Shows transcript in conversation card format with search functionality
 * Supports multiple transcript iterations for recurring meetings
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { TranscriptViewer } from './TranscriptViewer';
import { Participant, ApiConfig, FormState } from '../../types';
import { telemetryService } from '../../utils/telemetryService';
import { InterrogateTranscriptModal } from '../InterrogateTranscriptModal';

export interface TranscriptIteration {
  id: string;
  content: string;
  createdDateTime: string;
}

interface TranscriptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  participants: Participant[];
  meetingName?: string;
  meetingDate?: Date;
  iterations?: TranscriptIteration[]; // Multiple transcript iterations (for recurring meetings)
  onlineMeetingId?: string; // For lazy loading
  joinWebUrl?: string; // For lazy loading
  apiConfig: ApiConfig; // For interrogation modal
  addToast?: (message: string, type?: 'success' | 'error') => void; // For interrogation modal
}

export const TranscriptViewerModal: React.FC<TranscriptViewerModalProps> = ({
  isOpen,
  onClose,
  transcript,
  participants,
  meetingName,
  meetingDate,
  iterations,
  onlineMeetingId,
  joinWebUrl,
  apiConfig,
  addToast
}) => {
  const { t } = useTranslation(['common', 'forms']);
  const [selectedIterationIndex, setSelectedIterationIndex] = useState(0);
  const [loadedTranscripts, setLoadedTranscripts] = useState<Map<number, string>>(new Map());
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isInterrogateModalOpen, setIsInterrogateModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Dummy toast function if not provided
  const handleToast = (message: string, type?: 'success' | 'error') => {
    if (addToast) {
      addToast(message, type);
    } else {
      console.log(`[Toast] ${type || 'info'}: ${message}`);
    }
  };

  // Find the iteration that matches the selected meeting date and load initial transcripts
  useEffect(() => {
    if (isOpen && iterations && iterations.length > 0) {
      // Telemetry: Track transcript viewer opened
      telemetryService.trackEvent('transcriptViewerOpened', {
        meetingName: meetingName || 'Unknown',
        hasMultipleIterations: iterations.length > 1,
        iterationCount: iterations.length,
        transcriptLength: transcript.length
      });

      // Clear loaded transcripts when modal opens
      const newLoadedMap = new Map<number, string>();

      // Store already-loaded transcripts
      iterations.forEach((iteration, index) => {
        if (iteration.content && iteration.content.length > 0) {
          newLoadedMap.set(index, iteration.content);
        }
      });

      setLoadedTranscripts(newLoadedMap);

      // Find closest iteration to selected meeting date
      if (meetingDate) {
        const meetingTime = new Date(meetingDate).getTime();
        let closestIndex = 0;
        let closestDiff = Infinity;

        iterations.forEach((iteration, index) => {
          const iterationTime = new Date(iteration.createdDateTime).getTime();
          const diff = Math.abs(iterationTime - meetingTime);

          if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = index;
          }
        });

        console.log(`[TranscriptViewer] Selected meeting: ${meetingDate.toLocaleDateString()}`);
        console.log(`[TranscriptViewer] Closest iteration: ${iterations[closestIndex].createdDateTime} (index ${closestIndex})`);
        setSelectedIterationIndex(closestIndex);
      } else {
        setSelectedIterationIndex(0);
      }
    } else if (isOpen) {
      // Single iteration (no carousel)
      telemetryService.trackEvent('transcriptViewerOpened', {
        meetingName: meetingName || 'Unknown',
        hasMultipleIterations: false,
        iterationCount: 1,
        transcriptLength: transcript.length
      });
    }
  }, [isOpen, iterations, meetingDate, meetingName, transcript.length]);

  // Handle tab click - lazy load transcript if not already loaded
  const handleTabClick = async (index: number) => {
    if (!iterations || !onlineMeetingId) {
      setSelectedIterationIndex(index);
      return;
    }

    // Check if already loaded
    if (loadedTranscripts.has(index)) {
      console.log(`[TranscriptViewer] Using cached transcript for index ${index}`);
      setSelectedIterationIndex(index);

      // Telemetry: Track iteration switched (from cache)
      telemetryService.trackEvent('transcriptIterationSwitched', {
        fromIndex: selectedIterationIndex,
        toIndex: index,
        wasCached: true,
        iterationDate: iterations[index].createdDateTime
      });

      return;
    }

    // Lazy load this transcript
    const iteration = iterations[index];
    console.log(`[TranscriptViewer] Lazy loading transcript for ${new Date(iteration.createdDateTime).toLocaleDateString()}`);

    setIsLoadingTranscript(true);

    try {
      // Import TranscriptService
      const { TranscriptService } = await import('../../services/transcriptService');
      const { GraphService } = await import('../../services/graphService');

      const graphService = GraphService.getInstance();
      const transcriptService = new TranscriptService(graphService);

      const result = await transcriptService.fetchTranscriptById(
        onlineMeetingId,
        iteration.id,
        joinWebUrl
      );

      if (result.success && result.content) {
        // Store in loaded map
        const newMap = new Map(loadedTranscripts);
        newMap.set(index, result.content);
        setLoadedTranscripts(newMap);
        setSelectedIterationIndex(index);
        console.log(`[TranscriptViewer] ✅ Transcript loaded successfully`);

        // Telemetry: Track lazy load success
        telemetryService.trackEvent('transcriptLazyLoaded', {
          iterationIndex: index,
          iterationDate: iteration.createdDateTime,
          contentLength: result.content.length,
          success: true
        });

        // Telemetry: Track iteration switched (after lazy load)
        telemetryService.trackEvent('transcriptIterationSwitched', {
          fromIndex: selectedIterationIndex,
          toIndex: index,
          wasCached: false,
          iterationDate: iteration.createdDateTime
        });
      } else {
        console.error(`[TranscriptViewer] ❌ Failed to load transcript:`, result.error);

        // Telemetry: Track lazy load failure
        telemetryService.trackEvent('transcriptLazyLoaded', {
          iterationIndex: index,
          iterationDate: iteration.createdDateTime,
          contentLength: 0,
          success: false,
          error: result.error
        });

        // Still switch to tab, show error message
        setSelectedIterationIndex(index);
      }
    } catch (error) {
      console.error(`[TranscriptViewer] ❌ Error lazy loading transcript:`, error);

      // Telemetry: Track lazy load error
      telemetryService.trackEvent('transcriptLazyLoaded', {
        iterationIndex: index,
        iterationDate: iteration.createdDateTime,
        contentLength: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      setSelectedIterationIndex(index);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  // Get the currently displayed transcript content
  const currentTranscript = iterations && iterations.length > 0
    ? loadedTranscripts.get(selectedIterationIndex) || iterations[selectedIterationIndex]?.content || transcript
    : transcript;

  // Check if we have multiple iterations (recurring meeting)
  const hasMultipleIterations = iterations && iterations.length > 1;

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Update scroll position when modal opens
  useEffect(() => {
    if (isOpen && hasMultipleIterations) {
      setTimeout(checkScrollPosition, 100);
    }
  }, [isOpen, hasMultipleIterations, iterations]);

  // Scroll carousel left/right
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200; // Scroll by ~2 items
      const newScrollLeft = direction === 'left'
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(checkScrollPosition, 300);
    }
  };

  // Download transcript as text file
  const handleDownloadTranscript = () => {
    const blob = new Blob([currentTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = meetingName
      ? `${meetingName.replace(/[^a-z0-9]/gi, '_')}_transcript.txt`
      : 'meeting_transcript.txt';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Hide scrollbar CSS */}
      <style>{`
        .carousel-scrollable::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">
                {t('common:transcript.viewTranscript', 'View Transcript')}
                {hasMultipleIterations && (
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                    ({iterations!.length} iterations)
                  </span>
                )}
              </h2>
              {meetingName && (
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {meetingName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('common:actions.close', 'Close')}
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>

          {/* Iteration Carousel - Only show for recurring meetings with multiple transcripts */}
          {hasMultipleIterations && (
            <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
              <div className="px-6 pt-4 pb-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Meeting History
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                      {iterations!.length} sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    <span>Selected date</span>
                  </div>
                </div>

                {/* Carousel Container */}
                <div className="relative group">
                  {/* Left Arrow */}
                  {canScrollLeft && (
                    <button
                      onClick={() => scrollCarousel('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <Icon name="chevron-left" className="w-4 h-4" />
                    </button>
                  )}

                  {/* Scrollable Date Cards */}
                  <div
                    ref={carouselRef}
                    onScroll={checkScrollPosition}
                    className="carousel-scrollable flex gap-3 overflow-x-auto scroll-smooth px-1 py-2"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {iterations!.map((iteration, index) => {
                      const date = new Date(iteration.createdDateTime);
                      const isActiveTab = index === selectedIterationIndex;

                      // Find which iteration matches the originally selected meeting date
                      let isOriginalSelection = false;
                      if (meetingDate) {
                        const meetingTime = new Date(meetingDate).getTime();
                        const iterationTime = date.getTime();
                        const timeDiff = Math.abs(iterationTime - meetingTime);
                        isOriginalSelection = timeDiff < 24 * 60 * 60 * 1000;
                      }

                      const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
                      const day = date.getDate();

                      return (
                        <button
                          key={iteration.id}
                          onClick={() => handleTabClick(index)}
                          disabled={isLoadingTranscript}
                          className={`
                            relative flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl font-medium transition-all
                            ${isActiveTab
                              ? 'bg-primary text-white shadow-lg scale-105 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md hover:scale-102 border border-slate-200 dark:border-slate-700'
                            }
                            ${isLoadingTranscript ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {/* Selected date indicator */}
                          {isOriginalSelection && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full border-2 border-white dark:border-slate-900"></div>
                          )}

                          <span className="text-xs font-semibold uppercase opacity-80">
                            {monthShort}
                          </span>
                          <span className="text-xl font-bold leading-none mt-0.5">
                            {day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Arrow */}
                  {canScrollRight && (
                    <button
                      onClick={() => scrollCarousel('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <Icon name="chevron-right" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 relative">
            {/* Loading overlay */}
            {isLoadingTranscript && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Loading transcript...
                  </p>
                </div>
              </div>
            )}

            <TranscriptViewer
              transcript={currentTranscript}
              participants={participants}
              meetingName={meetingName}
              meetingDate={meetingDate}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('common:transcript.readonlyExplanation', 'This transcript was imported from your calendar meeting and cannot be edited directly.')}
            </p>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInterrogateModalOpen(true)}
              >
                <Icon name="interrogate" className="w-4 h-4 mr-2" />
                {t('common:actions.interrogateTranscript', 'Interrogate Transcript')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTranscript}
              >
                <Icon name="download" className="w-4 h-4 mr-2" />
                {t('common:actions.downloadTranscript', 'Download Transcript')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interrogate Transcript Modal */}
      <InterrogateTranscriptModal
        isOpen={isInterrogateModalOpen}
        onClose={() => setIsInterrogateModalOpen(false)}
        formState={{
          title: meetingName || 'Meeting Transcript',
          agenda: '', // No agenda from transcript viewer
          transcript: currentTranscript,
          userNotes: ''
        }}
        apiConfig={apiConfig}
        addToast={handleToast}
        suggestedQuestions={undefined} // Don't show suggestions since notes haven't been generated
      />
    </div>
  );
};
