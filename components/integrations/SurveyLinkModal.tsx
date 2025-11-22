// ============================================================================
// SURVEY LINK MODAL COMPONENT
// ============================================================================
// Link Qualtrics surveys to events

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';

// TypeScript Interfaces
export interface Survey {
  id: string;
  qualtricsSurveyId: string;
  name: string;
  eventId: string;
}

export interface SurveyLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    date: string;
    venueName: string;
  };
  existingSurvey?: Survey;
  onLinkSurvey: (qualtricsSurveyId: string) => Promise<void>;
  onRemoveSurvey?: () => Promise<void>;
}

export const SurveyLinkModal: React.FC<SurveyLinkModalProps> = ({
  isOpen,
  onClose,
  event,
  existingSurvey,
  onLinkSurvey,
  onRemoveSurvey,
}) => {
  const [surveyId, setSurveyId] = useState(existingSurvey?.qualtricsSurveyId || '');
  const [linking, setLinking] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!isOpen) return null;

  // Generate preview survey link
  const getSurveyLink = (id: string) => {
    if (!id) return '';
    // Qualtrics survey link format: https://{datacenter}.qualtrics.com/jfe/form/{surveyId}
    return `https://qualtrics.com/jfe/form/${id}`;
  };

  const handleLinkSurvey = async () => {
    if (!surveyId) {
      alert('Please enter a Qualtrics Survey ID');
      return;
    }

    setLinking(true);
    try {
      await onLinkSurvey(surveyId);
      onClose();
    } catch (error) {
      console.error('Failed to link survey:', error);
      alert('Failed to link survey');
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveSurvey = async () => {
    if (!onRemoveSurvey) return;

    setRemoving(true);
    try {
      await onRemoveSurvey();
      setSurveyId('');
    } catch (error) {
      console.error('Failed to remove survey:', error);
      alert('Failed to remove survey');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Link Survey to Event
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect a Qualtrics survey to collect event data
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>

          {/* Event Details (Read-only) */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Event Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Icon name="calendar" className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {event.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {event.date}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="location" className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {event.venueName}
                </div>
              </div>
            </div>
          </div>

          {/* Survey ID Input */}
          <div className="space-y-3">
            <Input
              label="Qualtrics Survey ID"
              id="survey-id"
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              placeholder="e.g., SV_abc123xyz"
              disabled={!!existingSurvey && !removing}
            />

            {/* Help text */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Where to find Survey ID:</p>
                  <p className="text-xs">
                    In Qualtrics, go to <strong>Survey</strong> → <strong>Tools</strong> → <strong>Survey ID</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {surveyId && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Survey Link Preview:
                </div>
                <a
                  href={getSurveyLink(surveyId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  {getSurveyLink(surveyId)}
                  <Icon name="external" className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Existing Survey Info */}
          {existingSurvey && !removing && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Survey Already Linked
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Survey ID: {existingSurvey.qualtricsSurveyId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={linking || removing}
            >
              Cancel
            </Button>

            {existingSurvey && !removing ? (
              <div className="flex gap-2 flex-1">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRemoving(true)}
                  disabled={linking}
                >
                  Update
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleRemoveSurvey}
                  disabled={linking}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleLinkSurvey}
                disabled={!surveyId || linking || removing}
              >
                {linking ? (
                  <>
                    <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Icon name="link" className="w-4 h-4 mr-2" />
                    Link Survey
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const [showSurveyModal, setShowSurveyModal] = useState(false);
 *
 * <SurveyLinkModal
 *   isOpen={showSurveyModal}
 *   onClose={() => setShowSurveyModal(false)}
 *   event={{
 *     id: 'event-123',
 *     name: 'Verizon 5G Activation',
 *     date: 'November 15, 2025',
 *     venueName: 'Times Square, New York',
 *   }}
 *   existingSurvey={undefined} // or { id: '1', qualtricsSurveyId: 'SV_abc123', name: 'Event Feedback', eventId: 'event-123' }
 *   onLinkSurvey={async (qualtricsSurveyId) => {
 *     await fetch('/api/surveys', {
 *       method: 'POST',
 *       body: JSON.stringify({ eventId: 'event-123', qualtricsSurveyId }),
 *     });
 *   }}
 *   onRemoveSurvey={async () => {
 *     await fetch('/api/surveys/1', { method: 'DELETE' });
 *   }}
 * />
 */
