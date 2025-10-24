/**
 * Resets all user-saved data to defaults
 * This includes theme preferences, form state, bot ID, tour completion, language settings, etc.
 */
export const resetAllUserData = (): void => {
  // List of all localStorage keys used by the application
  const localStorageKeys = [
    'darkMode',              // Theme preference
    'formState',             // Saved form inputs (title, agenda, transcript, tags)
    'botId',                 // Custom bot ID override
    'tourCompleted',         // Tutorial completion status
    'appLanguage',           // Selected language preference
    'presencePermissionBannerDismissed',  // Presence permission banner dismissal
    'participantExtractionDisabled',      // "Do not ask me again" for participant extraction
    // Note: 'authToken' is intentionally NOT cleared as it's needed for authentication
  ];

  // Clear each localStorage item
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear sessionStorage items (except login tracking)
  // We keep 'hasTrackedLogin' to prevent duplicate telemetry events
  // sessionStorage.removeItem('hasTrackedLogin'); // Intentionally commented out

  console.log('[Reset] User data has been reset to defaults');
};

/**
 * Checks if user has disabled participant extraction prompts
 */
export const isParticipantExtractionDisabled = (): boolean => {
  return localStorage.getItem('participantExtractionDisabled') === 'true';
};

/**
 * Sets the participant extraction disabled preference
 */
export const setParticipantExtractionDisabled = (disabled: boolean): void => {
  if (disabled) {
    localStorage.setItem('participantExtractionDisabled', 'true');
  } else {
    localStorage.removeItem('participantExtractionDisabled');
  }
};
