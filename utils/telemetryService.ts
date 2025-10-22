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

interface UserContext {
    name: string | null;
    email: string;
    tenantId: string | null;
}

interface EventEnvelope {
    appName: string;
    appVersion: string;
    sessionId: string;
    correlationId: string | null;
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
                name: user.name ?? null,
                email: user.username,
                tenantId: user.tenantId ?? null,
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
            correlationId: correlationId || null,
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

        fetch(flowUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(envelope),
        })
        .then(response => {
            if (!response.ok) {
                console.warn(`Telemetry flow trigger failed with status ${response.status}.`, {
                    url: flowUrl,
                    status: response.status,
                    statusText: response.statusText,
                });
            }
        })
        .catch(error => {
            console.warn("An error occurred while trying to trigger the telemetry flow.", error);
        });
    }
}

export const telemetryService = new TelemetryService();
