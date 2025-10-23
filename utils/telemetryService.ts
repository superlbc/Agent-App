import { AccountInfo } from "@azure/msal-browser";
import { appConfig } from '../appConfig';

// Event types specific to Meeting Notes Generator
export type EventType =
  // Authentication
  | 'userLogin'
  | 'userLogout'
  // Core functionality
  | 'notesGenerated'
  | 'notesRegenerated'
  // Exports
  | 'exportedToCSV'
  | 'exportedToPDF'
  | 'exportedToEmail'
  | 'copiedToClipboard'
  // Transcript interaction
  | 'transcriptInterrogated'
  | 'questionAsked'
  // Settings
  | 'botIdChanged'
  | 'settingsOpened'
  // Data input
  | 'sampleDataLoaded'
  | 'formCleared'
  | 'transcriptFileUploaded'
  | 'docxFileUploaded'
  // Presets
  | 'presetSelected'
  // Tour
  | 'tourStarted'
  | 'tourCompleted'
  | 'tourDismissed'
  // Coach
  | 'meetingCoachViewed'
  | 'coachInsightsExpanded';

// Login event payload structure
export interface LoginEventPayload {
  // Browser information (always available)
  browser: string;
  browserVersion: string;
  userAgent: string;

  // Platform information (always available)
  platform: string;
  platformVersion: string;

  // Display information (always available)
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  orientation: string;
  isFullscreen: boolean;

  // Device information (always available)
  deviceType: string;
  touchSupported: boolean;
  maxTouchPoints: number;

  // Locale information (always available)
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;

  // App state (always available)
  theme: string;

  // Connection information (optional - mainly Chrome/Edge)
  connectionType?: string;
  connectionEffectiveType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;
  connectionSaveData?: boolean;

  // Capabilities (always available)
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  webWorkersSupported: boolean;
  serviceWorkerSupported: boolean;

  // Performance information (optional - mainly Chrome)
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

interface UserContext {
    name: string;
    email: string;
    tenantId: string;
}

interface EventEnvelope {
    appName: string;
    appVersion: string;
    sessionId: string;
    correlationId: string;
    eventType: EventType;
    timestamp: string;
    userContext: UserContext;
    eventPayload: string; // JSON stringified
}

const APP_NAME = 'Meeting Notes Generator';
const APP_VERSION = '1.0.0';

class TelemetryService {
    private sessionId: string;
    private userContext: UserContext | null = null;

    constructor() {
        this.sessionId = this.getSessionId();
    }

    private getSessionId(): string {
        let sid = sessionStorage.getItem('telemetrySessionId');
        if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem('telemetrySessionId', sid);
        }
        return sid;
    }

    public setUser(user: AccountInfo | null) {
        if (user) {
            this.userContext = {
                name: user.name ?? '',
                email: user.username,
                tenantId: user.tenantId ?? '',
            };
        } else {
            this.userContext = null;
        }
    }

    public trackEvent(eventType: EventType, eventPayload: object, correlationId?: string | null): void {
        if (!this.userContext) {
            console.warn(`Telemetry: User context not set. Skipping event tracking for '${eventType}'.`);
            return;
        }

        const envelope: EventEnvelope = {
            appName: APP_NAME,
            appVersion: APP_VERSION,
            sessionId: this.sessionId,
            correlationId: correlationId || '',
            eventType: eventType,
            timestamp: new Date().toISOString(),
            userContext: this.userContext,
            eventPayload: JSON.stringify(eventPayload),
        };

        this.sendEvent(envelope);
    }

    private sendEvent(envelope: EventEnvelope): void {
        const flowUrl = appConfig.telemetryFlowUrl;

        if (!flowUrl || flowUrl.startsWith("PASTE_YOUR_") || flowUrl.startsWith("YOUR_")) {
            console.warn("Telemetry flow URL is not configured. Skipping event trigger.", envelope);
            return;
        }

        // Log the payload being sent (useful for debugging)
        console.log('📊 Telemetry Event:', envelope.eventType, {
            sessionId: envelope.sessionId,
            correlationId: envelope.correlationId,
            user: envelope.userContext.email,
            payload: JSON.parse(envelope.eventPayload)
        });

        fetch(flowUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(envelope),
        })
        .then(async response => {
            if (!response.ok) {
                // Try to get error details from response
                let errorDetails = '';
                try {
                    const text = await response.text();
                    errorDetails = text;
                } catch (e) {
                    // Ignore if we can't read the response
                }

                console.error(`❌ Telemetry flow trigger failed with status ${response.status}`, {
                    url: flowUrl,
                    status: response.status,
                    statusText: response.statusText,
                    eventType: envelope.eventType,
                    errorDetails: errorDetails,
                    sentPayload: envelope
                });
            } else {
                console.log(`✅ Telemetry event sent successfully: ${envelope.eventType}`);
            }
        })
        .catch(error => {
            console.error("❌ An error occurred while trying to trigger the telemetry flow.", {
                error,
                eventType: envelope.eventType,
                sentPayload: envelope
            });
        });
    }
}

export const telemetryService = new TelemetryService();
