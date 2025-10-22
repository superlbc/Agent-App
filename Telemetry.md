# Telemetry Documentation

## Overview

The Meeting Notes Generator application implements a comprehensive telemetry framework to track user behavior, feature usage, and application performance. All events are sent to a centralized Power Automate endpoint for analysis and reporting.

**Key Features:**
- 24 distinct event types covering the entire user journey
- Privacy-focused: Bot IDs are hashed, meeting content is never transmitted
- Fire-and-forget pattern: Network failures don't block the UI
- Session-based tracking with unique session IDs
- Correlation IDs for linking related events

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Meeting Notes Generator                         │
│                                                                       │
│  ┌──────────────┐         ┌─────────────────┐                       │
│  │   UI Actions │────────▶│ TelemetryService│                       │
│  └──────────────┘         └────────┬────────┘                       │
│                                     │                                 │
│                                     │ JSON Event Envelope             │
│                                     │                                 │
│                                     ▼                                 │
│                          ┌──────────────────┐                        │
│                          │  Power Automate  │                        │
│                          │   HTTP Trigger   │                        │
│                          └────────┬─────────┘                        │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Data Storage    │
                          │  (Excel/Dataverse│
                          │   /Power BI)     │
                          └──────────────────┘
```

---

## Event Types (24 Total)

### 1. Authentication Events (2)

#### `userLogin`
**Trigger:** User successfully authenticates with Azure AD
**Frequency:** Once per session
**Location:** [App.tsx:101](App.tsx#L101)
**Payload:**
```json
{}
```

#### `userLogout`
**Trigger:** User explicitly signs out
**Frequency:** Once per logout
**Status:** ⚠️ Not currently implemented
**Payload:**
```json
{}
```

---

### 2. Core Functionality Events (2)

#### `notesGenerated`
**Trigger:** User generates meeting notes for the first time in a session
**Frequency:** Once per form submission (first generation)
**Location:** [App.tsx:138](App.tsx#L138)
**Payload:**
```json
{
  "meetingTitle": "string",
  "transcriptLength": 12450,
  "agendaItemCount": 3,
  "audience": "department-specific",
  "tone": "professional",
  "viewMode": "full",
  "meetingCoachEnabled": true,
  "coachingStyle": "gentle",
  "preset": "internal-sync",
  "criticalLens": true,
  "redactionEnabled": false,
  "useIcons": true,
  "boldKeywords": false,
  "actionItemCount": 8,
  "hasTags": true
}
```

#### `notesRegenerated`
**Trigger:** User regenerates notes after the initial generation
**Frequency:** Every regeneration after the first
**Location:** [App.tsx:138](App.tsx#L138)
**Payload:** Same as `notesGenerated`
**Note:** Uses correlation ID to link regenerations to original generation

---

### 3. Export Events (4)

#### `copiedToClipboard`
**Trigger:** User copies notes to clipboard (Rich Text or Plain Text)
**Frequency:** Each clipboard copy
**Location:** [OutputPanel.tsx:300, 311](components/OutputPanel.tsx#L300)
**Payload:**
```json
{
  "format": "richText" | "plainText"
}
```

#### `exportedToPDF`
**Trigger:** User downloads notes as PDF
**Frequency:** Each PDF download
**Location:** [OutputPanel.tsx:328](components/OutputPanel.tsx#L328)
**Payload:**
```json
{
  "contentLength": 15782
}
```

#### `exportedToEmail`
**Trigger:** User drafts email with action items
**Frequency:** Each email draft
**Location:** [OutputPanel.tsx:376](components/OutputPanel.tsx#L376)
**Payload:**
```json
{
  "actionItemCount": 8
}
```

#### `exportedToCSV`
**Trigger:** User downloads action items as CSV
**Frequency:** Each CSV download
**Location:** [OutputPanel.tsx:415](components/OutputPanel.tsx#L415)
**Payload:**
```json
{
  "actionItemCount": 8
}
```

---

### 4. Transcript Interaction Events (2)

#### `transcriptInterrogated`
**Trigger:** User opens the "Interrogate Transcript" modal
**Frequency:** Each time modal is opened
**Location:** [OutputPanel.tsx:538](components/OutputPanel.tsx#L538)
**Payload:**
```json
{
  "transcriptLength": 12450
}
```

#### `questionAsked`
**Trigger:** User asks a question in the Interrogate modal
**Frequency:** Each question submitted
**Location:** [InterrogateTranscriptModal.tsx:124](components/InterrogateTranscriptModal.tsx#L124)
**Payload:**
```json
{
  "questionLength": 42,
  "conversationTurn": 3
}
```

---

### 5. Settings Events (2)

#### `settingsOpened`
**Trigger:** User opens the settings drawer
**Frequency:** Each time drawer is opened
**Location:** [SettingsDrawer.tsx:31](components/SettingsDrawer.tsx#L31)
**Payload:**
```json
{}
```

#### `botIdChanged`
**Trigger:** User changes bot ID (Save or Reset to Default)
**Frequency:** Each bot ID change
**Location:** [SettingsDrawer.tsx:52, 68](components/SettingsDrawer.tsx#L52)
**Payload:**
```json
{
  "previousBotIdHash": "a3f5c890",
  "newBotIdHash": "b7e2d491"
}
```
**Privacy Note:** Bot IDs are hashed using a simple hash function

---

### 6. Data Input Events (4)

#### `sampleDataLoaded`
**Trigger:** User clicks "Use Sample Data" button
**Frequency:** Each sample data load
**Location:** [App.tsx:189](App.tsx#L189)
**Payload:**
```json
{
  "sampleTitle": "Sample Meeting Title"
}
```

#### `formCleared`
**Trigger:** User clicks "Clear Form" button
**Frequency:** Each form clear
**Location:** [App.tsx:182](App.tsx#L182)
**Payload:**
```json
{}
```

#### `transcriptFileUploaded`
**Trigger:** User uploads a .txt transcript file
**Frequency:** Each TXT file upload
**Location:** [InputPanel.tsx:100](components/InputPanel.tsx#L100)
**Payload:**
```json
{
  "fileSize": 28694,
  "fileName": "meeting_transcript.txt"
}
```

#### `docxFileUploaded`
**Trigger:** User uploads a .docx transcript file
**Frequency:** Each DOCX file upload
**Location:** [InputPanel.tsx:121](components/InputPanel.tsx#L121)
**Payload:**
```json
{
  "fileSize": 45123,
  "fileName": "meeting_notes.docx"
}
```

---

### 7. Preset Events (1)

#### `presetSelected`
**Trigger:** User clicks a meeting preset button
**Frequency:** Each preset selection
**Location:** [InputPanel.tsx:59](components/InputPanel.tsx#L59)
**Payload:**
```json
{
  "preset": "internal-sync",
  "audience": "department-specific",
  "tone": "professional",
  "viewMode": "full",
  "criticalLens": true,
  "redactionEnabled": false,
  "meetingCoachEnabled": true,
  "coachingStyle": "gentle"
}
```

**Preset Options:**
- `internal-sync` - Internal team meetings
- `client-update` - External client meetings
- `brainstorm` - Creative sessions
- `executive-briefing` - Leadership updates
- `retrospective` - Sprint retrospectives
- `planning` - Planning sessions
- `training` - Training/workshop sessions

---

### 8. Tour Events (3)

#### `tourStarted`
**Trigger:** User starts the product tour
**Frequency:** Each tour start
**Location:** [TourContext.tsx:21](contexts/TourContext.tsx#L21)
**Payload:**
```json
{}
```

#### `tourCompleted`
**Trigger:** User completes the entire tour (clicks "Finish")
**Frequency:** Once per tour completion
**Location:** [TourStep.tsx:174](components/tour/TourStep.tsx#L174)
**Payload:**
```json
{
  "totalSteps": 28
}
```

#### `tourDismissed`
**Trigger:** User closes tour early (X button or "End Tour")
**Frequency:** Each tour dismissal
**Location:** [TourStep.tsx:138, 163](components/tour/TourStep.tsx#L138)
**Payload:**
```json
{
  "currentStep": 5,
  "totalSteps": 28
}
```

---

### 9. Coach Events (2)

#### `meetingCoachViewed`
**Trigger:** User views the Meeting Coach section
**Frequency:** Each view
**Status:** ⚠️ Not currently implemented
**Payload:**
```json
{
  "coachingStyle": "gentle"
}
```

#### `coachInsightsExpanded`
**Trigger:** User expands coach insights panel
**Frequency:** Each expansion
**Status:** ⚠️ Not currently implemented
**Payload:**
```json
{}
```

---

## User Flow with Telemetry

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                     │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  VISIT   │
    │   APP    │
    └────┬─────┘
         │
         ▼
    ┌──────────────┐
    │ Azure AD     │ ───────► 📊 userLogin
    │ Sign In      │
    └────┬─────────┘
         │
         ▼
    ┌──────────────┐
    │ Tour Welcome │
    │    Modal     │
    └────┬─────────┘
         │
         ├─ Start Tour ─────► 📊 tourStarted
         │                    📊 tourCompleted (if finished)
         │                    📊 tourDismissed (if closed early)
         │
         ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    INPUT SECTION                              │
    └──────────────────────────────────────────────────────────────┘
         │
         ├─ Load Sample ────► 📊 sampleDataLoaded
         │
         ├─ Upload TXT ─────► 📊 transcriptFileUploaded
         │
         ├─ Upload DOCX ────► 📊 docxFileUploaded
         │
         ├─ Select Preset ──► 📊 presetSelected
         │
         ├─ Open Settings ──► 📊 settingsOpened
         │   └─ Change Bot ─► 📊 botIdChanged
         │
         ├─ Clear Form ─────► 📊 formCleared
         │
         ▼
    ┌──────────────┐
    │   GENERATE   │ ───────► 📊 notesGenerated (first time)
    │    NOTES     │          📊 notesRegenerated (subsequent)
    └────┬─────────┘
         │
         ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                   OUTPUT SECTION                              │
    └──────────────────────────────────────────────────────────────┘
         │
         ├─ Copy Rich Text ─► 📊 copiedToClipboard {format: "richText"}
         │
         ├─ Copy Plain ─────► 📊 copiedToClipboard {format: "plainText"}
         │
         ├─ Download PDF ───► 📊 exportedToPDF
         │
         ├─ Draft Email ────► 📊 exportedToEmail
         │
         ├─ Download CSV ───► 📊 exportedToCSV
         │
         └─ Interrogate ────► 📊 transcriptInterrogated
             └─ Ask Q ──────► 📊 questionAsked (per question)
```

---

## Feature Adoption Funnel

```
┌────────────────────────────────────────────────────────────────┐
│                    CONVERSION FUNNEL                            │
└────────────────────────────────────────────────────────────────┘

  100% │ ███████████████████████ userLogin
       │
   85% │ ████████████████████ presetSelected
       │
   75% │ ██████████████████ notesGenerated
       │
   45% │ ███████████ copiedToClipboard / exportedToPDF
       │
   20% │ █████ transcriptInterrogated
       │
   12% │ ███ exportedToEmail / exportedToCSV
       │
    5% │ █ tourStarted
```

---

## Event Envelope Structure

Every telemetry event is wrapped in a standardized envelope:

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.0.0",
  "sessionId": "02288ed8-0c5e-4c9b-b4cb-2f7905812f15",
  "correlationId": "314b01c1-3d2f-446a-9ff5-0024d7b45368",
  "eventType": "notesGenerated",
  "timestamp": "2025-10-22T20:15:32.456Z",
  "userContext": {
    "name": "Luis Bustos",
    "email": "luis.bustos@momentumww.com",
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "eventPayload": "{\"meetingTitle\":\"Project Kickoff\",\"transcriptLength\":12450}"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `appName` | string | Always "Meeting Notes Generator" |
| `appVersion` | string | Application version (e.g., "1.0.0") |
| `sessionId` | string | Unique session ID (UUID v4, stored in sessionStorage) |
| `correlationId` | string | Optional ID to link related events (e.g., regenerations) |
| `eventType` | string | One of 24 event types |
| `timestamp` | string | ISO 8601 timestamp (UTC) |
| `userContext.name` | string | User's display name (empty if unavailable) |
| `userContext.email` | string | User's email (always present after login) |
| `userContext.tenantId` | string | Azure AD tenant ID (empty if unavailable) |
| `eventPayload` | string | JSON-stringified event-specific data |

---

## Session Management

**Session ID:**
- Generated once per browser session using `crypto.randomUUID()`
- Stored in `sessionStorage` (cleared when tab/browser closes)
- Used to track all events within a single user session
- Enables session-based analytics (e.g., "How many notes generated per session?")

**Correlation ID:**
- Optional parameter for linking related events
- Currently used for `notesGenerated` → `notesRegenerated` linking
- Generated using `crypto.randomUUID()` on first generation
- Reused for all regenerations of the same notes

---

## Privacy & Security

### What We Track ✅
- User authentication events (email, name, tenant)
- Feature usage patterns (clicks, selections, exports)
- Session duration and engagement
- Meeting metadata (title length, transcript length, agenda item count)
- Configuration choices (presets, settings, controls)

### What We DON'T Track ❌
- **Meeting content** (transcripts, agendas, attendees)
- **Generated notes** (summaries, action items, decisions)
- **Interrogate questions/answers** (conversation content)
- **Actual bot IDs** (only hashed values)
- **PII beyond Azure AD context** (no phone, address, etc.)

### Hashing Function
Bot IDs are hashed before transmission:

```typescript
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};
```

---

## Configuration

### 1. Set Power Automate URL

Edit [appConfig.ts](appConfig.ts):

```typescript
export const appConfig = {
  telemetryFlowUrl: "https://[environment].powerplatform.com:443/..."
};
```

### 2. Power Automate Flow Schema

Your HTTP trigger should accept this schema:

```json
{
  "type": "object",
  "properties": {
    "appName": { "type": "string" },
    "appVersion": { "type": "string" },
    "sessionId": { "type": "string" },
    "correlationId": { "type": "string" },
    "eventType": { "type": "string" },
    "timestamp": { "type": "string" },
    "userContext": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" },
        "tenantId": { "type": "string" }
      }
    },
    "eventPayload": { "type": "string" }
  }
}
```

**Important:** All fields should allow empty strings (not null).

### 3. Disable Telemetry (Optional)

Set URL to placeholder value in [appConfig.ts](appConfig.ts):

```typescript
telemetryFlowUrl: "YOUR_POWER_AUTOMATE_TELEMETRY_FLOW_URL"
```

The app will log warnings to console but continue functioning normally.

---

## Analytics Examples

### Key Metrics to Track

**User Engagement:**
- Daily/Weekly/Monthly Active Users (from `userLogin`)
- Sessions per user
- Average session duration

**Feature Adoption:**
- Preset usage distribution (from `presetSelected`)
- Export format preferences (PDF vs CSV vs Email vs Clipboard)
- Interrogate feature usage rate
- Tour completion rate

**Content Patterns:**
- Average transcript length
- Average agenda item count
- Regeneration rate (notes tweaked how many times?)
- Meeting coach enablement rate

**Conversion Funnel:**
```
userLogin → presetSelected → notesGenerated → copiedToClipboard
```

### Power BI DAX Examples

**Calculate Average Notes Per Session:**
```dax
AvgNotesPerSession =
DIVIDE(
    COUNTROWS(FILTER(Events, Events[eventType] = "notesGenerated")),
    DISTINCTCOUNT(Events[sessionId])
)
```

**Most Popular Preset:**
```dax
MostPopularPreset =
TOPN(
    1,
    SUMMARIZE(
        FILTER(Events, Events[eventType] = "presetSelected"),
        Events[eventPayload.preset],
        "Count", COUNT(Events[eventType])
    ),
    [Count],
    DESC
)
```

**Tour Completion Rate:**
```dax
TourCompletionRate =
DIVIDE(
    COUNTROWS(FILTER(Events, Events[eventType] = "tourCompleted")),
    COUNTROWS(FILTER(Events, Events[eventType] = "tourStarted"))
)
```

---

## Debugging

### Enable Console Logging

Telemetry events are automatically logged to the browser console:

**Success:**
```
📊 Telemetry Event: notesGenerated {
  sessionId: "02288ed8...",
  correlationId: "314b01c1...",
  user: "luis.bustos@momentumww.com",
  payload: { meetingTitle: "...", ... }
}
✅ Telemetry event sent successfully: notesGenerated
```

**Failure:**
```
❌ Telemetry flow trigger failed with status 400 {
  url: "https://...",
  status: 400,
  statusText: "Bad Request",
  eventType: "notesGenerated",
  errorDetails: "Schema validation failed...",
  sentPayload: { ... }
}
```

### Common Issues

**Issue:** "Telemetry flow URL is not configured"
**Solution:** Set `telemetryFlowUrl` in [appConfig.ts](appConfig.ts)

**Issue:** "User context not set. Skipping event tracking"
**Solution:** Ensure user is authenticated before tracking events

**Issue:** "400 Bad Request - Schema validation failed"
**Solution:** Update Power Automate flow schema to allow empty strings (not null)

---

## Testing Telemetry

### Manual Testing Checklist

- [ ] Sign in → verify `userLogin` event
- [ ] Load sample data → verify `sampleDataLoaded`
- [ ] Upload TXT file → verify `transcriptFileUploaded`
- [ ] Upload DOCX file → verify `docxFileUploaded`
- [ ] Select preset → verify `presetSelected`
- [ ] Generate notes → verify `notesGenerated`
- [ ] Regenerate notes → verify `notesRegenerated` with same correlationId
- [ ] Copy rich text → verify `copiedToClipboard {format: "richText"}`
- [ ] Copy plain text → verify `copiedToClipboard {format: "plainText"}`
- [ ] Download PDF → verify `exportedToPDF`
- [ ] Draft email → verify `exportedToEmail`
- [ ] Download CSV → verify `exportedToCSV`
- [ ] Open interrogate modal → verify `transcriptInterrogated`
- [ ] Ask question → verify `questionAsked`
- [ ] Open settings → verify `settingsOpened`
- [ ] Change bot ID → verify `botIdChanged`
- [ ] Clear form → verify `formCleared`
- [ ] Start tour → verify `tourStarted`
- [ ] Complete tour → verify `tourCompleted`
- [ ] Dismiss tour → verify `tourDismissed`

### Automated Testing

Use browser DevTools Network tab to inspect requests:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Perform actions in the app
5. Look for POST requests to Power Automate URL
6. Inspect request payload and response

---

## Implementation Files

| File | Purpose |
|------|---------|
| [utils/telemetryService.ts](utils/telemetryService.ts) | Core telemetry service |
| [appConfig.ts](appConfig.ts) | Power Automate endpoint configuration |
| [App.tsx](App.tsx) | Authentication, generation, input events |
| [components/OutputPanel.tsx](components/OutputPanel.tsx) | Export and interrogate events |
| [components/InputPanel.tsx](components/InputPanel.tsx) | Upload and preset events |
| [components/SettingsDrawer.tsx](components/SettingsDrawer.tsx) | Settings events |
| [components/InterrogateTranscriptModal.tsx](components/InterrogateTranscriptModal.tsx) | Question events |
| [contexts/TourContext.tsx](contexts/TourContext.tsx) | Tour start event |
| [components/tour/TourStep.tsx](components/tour/TourStep.tsx) | Tour completion/dismissal events |
| [components/tour/TourController.tsx](components/tour/TourController.tsx) | Tour orchestration (no direct telemetry) |

---

## Changelog

### Version 1.0.0 (2025-10-22)

**Initial Release:**
- ✅ 24 event types implemented
- ✅ Centralized telemetry service
- ✅ Power Automate integration
- ✅ Privacy-focused design (no content transmission)
- ✅ Session and correlation ID support
- ✅ Fire-and-forget pattern with error handling
- ✅ Comprehensive logging for debugging

**Bug Fixes:**
- 🐛 Fixed infinite loop in TourController causing excessive `formCleared` events
- 🐛 Fixed Power Automate schema mismatch (null → empty string)

**Not Yet Implemented:**
- ⏳ `userLogout` event
- ⏳ `meetingCoachViewed` event
- ⏳ `coachInsightsExpanded` event

---

## Support

For issues or questions:
1. Check browser console for telemetry logs
2. Verify Power Automate flow is running
3. Review [README.md](README.md) for general setup
4. Check Power Automate flow run history for errors

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
**Maintained By:** IPCT Team
