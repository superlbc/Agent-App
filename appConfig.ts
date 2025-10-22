// Power Automate Flow Configuration
// Replace these placeholder URLs with your actual Power Automate flow URLs

export const appConfig = {
  // Triggered when user signs in (legacy, optional)
  userLoginFlowUrl: "YOUR_POWER_AUTOMATE_LOGIN_FLOW_URL",

  // Triggered when meeting notes are generated (legacy, optional)
  notesGeneratedFlowUrl: "YOUR_POWER_AUTOMATE_NOTES_FLOW_URL",

  // Centralized endpoint for all telemetry events (RECOMMENDED)
  telemetryFlowUrl: "YOUR_POWER_AUTOMATE_TELEMETRY_FLOW_URL"
};

/*
 * Power Automate URL Format:
 * https://[environment].powerplatform.com:443/powerautomate/automations/direct/
 * workflows/[workflow-id]/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=[signature]
 *
 * To get your flow URLs:
 * 1. Create an HTTP trigger flow in Power Automate
 * 2. Copy the HTTP POST URL from the trigger
 * 3. Paste it here
 *
 * Note: If URLs are not configured (still contain "YOUR_"), telemetry will be disabled
 * with console warnings, and the app will continue to function normally.
 */
