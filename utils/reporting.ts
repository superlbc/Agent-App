/**
 * Legacy Power Automate Flow Trigger Utility
 *
 * Fire-and-forget function to trigger specific Power Automate flows
 * for backwards compatibility with legacy event tracking systems.
 *
 * For new implementations, prefer using telemetryService.trackEvent()
 * which provides centralized tracking with richer metadata.
 */
export const triggerPowerAutomateFlow = (flowUrl: string, payload: object): void => {
  if (!flowUrl || flowUrl.startsWith("PASTE_YOUR_") || flowUrl.startsWith("YOUR_")) {
    console.warn("Power Automate flow URL is not configured. Skipping trigger.");
    return;
  }

  fetch(flowUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  .then(response => {
    if (!response.ok) {
      console.warn(`Power Automate flow trigger failed with status ${response.status}.`, {
        url: flowUrl,
        status: response.status,
        statusText: response.statusText,
      });
    }
  })
  .catch(error => {
    console.warn("An error occurred while trying to trigger the Power Automate flow.", error);
  });
};
