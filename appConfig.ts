// Power Automate Flow Configuration
// Replace the placeholder URL with your actual Power Automate flow URL

export const appConfig = {
  // Centralized endpoint for all telemetry events
  telemetryFlowUrl: "https://2e7cf80af71de950a36d4962c11a22.06.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/579ee4bc3fb44c8daf7e6b9bc28f41ec/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=V8bdLaSJHkXCTc8xptUKLGt2crZtbrZUg7yqLTpD-Vs",

  // Momentum Department Data API endpoint
  // Fetches employee department, role, and organizational info from SQL database
  momentumDepartmentFlowUrl: "https://2e7cf80af71de950a36d4962c11a22.06.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/11a82bd0a6eb4da799b636025b1d7f9e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iGVxmlna0RFZSlWah_j40wb8uHiGpwEElw7MhCImNps",
};

/*
 * Power Automate URL Format:
 * https://[environment].powerplatform.com:443/powerautomate/automations/direct/
 * workflows/[workflow-id]/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=[signature]
 *
 * To get your flow URL:
 * 1. Create an HTTP trigger flow in Power Automate
 * 2. Configure the flow to receive the telemetry event schema (see README.md)
 * 3. Copy the HTTP POST URL from the trigger
 * 4. Paste it above
 *
 * Expected JSON Schema:
 * {
 *   "appName": "string",
 *   "appVersion": "string",
 *   "sessionId": "string",
 *   "correlationId": "string",
 *   "eventType": "string",
 *   "timestamp": "string",
 *   "userContext": {
 *     "name": "string",
 *     "email": "string",
 *     "tenantId": "string"
 *   },
 *   "eventPayload": "string (JSON)"
 * }
 *
 * Note: If URL is not configured (still contains "YOUR_"), telemetry will be disabled
 * with console warnings, and the app will continue to function normally.
 */
