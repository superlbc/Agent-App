/**
 * Feedback Service
 * Reuses telemetry infrastructure to submit user feedback
 */

import { telemetryService } from './telemetryService';
import { getBrowserContext, BrowserContextData } from './browserContext';
import { errorLogger } from './errorLogger';

export type FeedbackType = 'bug' | 'feature' | 'comment' | 'performance' | 'documentation';
export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low';

export interface FeedbackPayload {
  // Feedback details
  feedbackType: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;

  // Automatically captured context
  browserContext: BrowserContextData;
  url: string;
  page: string;

  // Error logs (if any)
  errorLogs?: {
    hasErrors: boolean;
    errorCount: number;
    warningCount: number;
    recentErrors: string[];
  };
}

class FeedbackService {
  /**
   * Submit feedback using the existing telemetry infrastructure
   * @param feedbackType Type of feedback (bug, feature, etc.)
   * @param priority Priority level
   * @param title Brief title
   * @param description Detailed description
   * @param isDarkMode Current theme state
   * @returns Promise that resolves when feedback is submitted
   */
  public async submitFeedback(
    feedbackType: FeedbackType,
    priority: FeedbackPriority,
    title: string,
    description: string,
    isDarkMode: boolean
  ): Promise<void> {
    try {
      // Capture browser context
      const browserContext = getBrowserContext(isDarkMode);

      // Capture current page URL and route
      const url = window.location.href;
      const page = this.getCurrentPage();

      // Capture error logs if any errors exist
      const errorLogs = errorLogger.hasErrors()
        ? errorLogger.getErrorSummary()
        : undefined;

      // Build feedback payload
      const feedbackPayload: FeedbackPayload = {
        feedbackType,
        priority,
        title,
        description,
        browserContext,
        url,
        page,
        errorLogs,
      };

      // Submit using telemetry service with eventType: "feedback"
      telemetryService.trackEvent('feedback', feedbackPayload);

      console.log('✅ Feedback submitted successfully', {
        type: feedbackType,
        priority,
        title,
      });
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Get current page/route for context
   */
  private getCurrentPage(): string {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // If it's a single-page app with hash routing
    if (hash) {
      return hash;
    }

    // Otherwise return pathname
    return path || '/';
  }
}

// Singleton instance
export const feedbackService = new FeedbackService();
