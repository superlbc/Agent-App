// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================
// React error boundary to catch and handle component errors gracefully

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console (in production, send to error tracking service)
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to telemetry service
    // trackError({
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    // });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Icon name="alert-triangle" className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              {this.state.error && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Error Message:
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Component Stack (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  What can you do?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Try reloading the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>If the problem persists, contact support</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                variant="primary"
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <Icon name="refresh-cw" className="w-4 h-4" />
                Reload Page
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <Icon name="arrow-left" className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your app or specific sections with ErrorBoundary:
 *
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * With custom fallback:
 *
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <CriticalSection />
 * </ErrorBoundary>
 *
 * Multiple boundaries for granular error isolation:
 *
 * <ErrorBoundary>
 *   <Header />
 *   <ErrorBoundary>
 *     <Sidebar />
 *   </ErrorBoundary>
 *   <ErrorBoundary>
 *     <MainContent />
 *   </ErrorBoundary>
 * </ErrorBoundary>
 */
