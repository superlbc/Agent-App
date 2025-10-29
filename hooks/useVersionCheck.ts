import { useState, useEffect, useCallback, useRef } from 'react';
import { telemetryService } from '../utils/telemetryService';

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
}

interface VersionCheckResult {
  updateAvailable: boolean;
  currentVersion: VersionInfo | null;
  serverVersion: VersionInfo | null;
  checkVersion: () => Promise<void>;
  dismissUpdate: () => void;
}

/**
 * Hook to check for application version updates
 *
 * Fetches version.json from the server and compares with the client version.
 * Polls periodically and on tab focus to detect new deployments.
 *
 * @param pollingInterval - Time in milliseconds between version checks (default: 5 minutes)
 * @returns Version check state and functions
 */
export function useVersionCheck(pollingInterval: number = 5 * 60 * 1000): VersionCheckResult {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [serverVersion, setServerVersion] = useState<VersionInfo | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasTrackedMismatch = useRef(false);

  /**
   * Fetches the version.json file from the server
   * Uses cache-busting query parameter to ensure fresh data
   */
  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      // Add cache-busting timestamp to ensure we always get fresh data
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch version.json:', response.statusText);
        return null;
      }

      const versionData: VersionInfo = await response.json();
      return versionData;
    } catch (error) {
      console.warn('Error fetching version:', error);
      return null;
    }
  }, []);

  /**
   * Checks if an update is available by comparing versions
   */
  const checkVersion = useCallback(async () => {
    const newServerVersion = await fetchVersion();

    if (!newServerVersion) {
      return;
    }

    // If this is the first check, store it as the current version
    if (!currentVersion) {
      setCurrentVersion(newServerVersion);
      setServerVersion(newServerVersion);
      return;
    }

    // Compare versions
    const hasUpdate =
      currentVersion.version !== newServerVersion.version ||
      currentVersion.buildTime !== newServerVersion.buildTime ||
      currentVersion.gitCommit !== newServerVersion.gitCommit;

    if (hasUpdate && !dismissed) {
      setServerVersion(newServerVersion);
      setUpdateAvailable(true);

      // Track version mismatch in telemetry (only once)
      if (!hasTrackedMismatch.current) {
        hasTrackedMismatch.current = true;
        telemetryService.trackEvent('versionMismatchDetected', {
          currentVersion: currentVersion.version,
          serverVersion: newServerVersion.version,
          currentBuildTime: currentVersion.buildTime,
          serverBuildTime: newServerVersion.buildTime,
          currentCommit: currentVersion.gitCommit,
          serverCommit: newServerVersion.gitCommit,
        });
      }
    }
  }, [currentVersion, fetchVersion, dismissed]);

  /**
   * Dismisses the update notification
   */
  const dismissUpdate = useCallback(() => {
    setDismissed(true);
    setUpdateAvailable(false);

    // Track dismissal in telemetry
    telemetryService.trackEvent('versionUpdateDismissed', {
      currentVersion: currentVersion?.version || 'unknown',
      serverVersion: serverVersion?.version || 'unknown',
    });
  }, [currentVersion, serverVersion]);

  // Initial version check on mount
  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  // Set up polling interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkVersion();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [checkVersion, pollingInterval]);

  // Check version on tab focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    const handleFocus = () => {
      checkVersion();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkVersion]);

  return {
    updateAvailable,
    currentVersion,
    serverVersion,
    checkVersion,
    dismissUpdate,
  };
}
