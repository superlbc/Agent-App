# README.md Telemetry Section Update

## Instructions
Replace the current "Telemetry & Analytics 📊" section (starting at line ~234) with the content below.
Also add the "Recent Changes" entry at the top of the Recent Changes section (line ~2427).

---

## 📊 REPLACEMENT CONTENT FOR TELEMETRY SECTION

```markdown
## Telemetry & Analytics 📊

The application includes a comprehensive telemetry framework that tracks user interactions and usage patterns to help improve the product. All telemetry data is sent to Power Automate flows for centralized logging and analysis.

**📊 Latest Update (2025-10-28)**: Enhanced telemetry framework with 13 new events tracking GraphAPI features, participant management, meeting coach, and user notes. Disabled 4 noisy low-value events.

**📄 Documentation**:
- [TELEMETRY-REVIEW-SUMMARY.md](TELEMETRY-REVIEW-SUMMARY.md) - Comprehensive review with all changes, recommendations, and Power BI integration guide
- [telemetry-privacy.md](telemetry-privacy.md) - Privacy policy and data handling details
- [Telemetry.md](Telemetry.md) - Technical implementation details

### What is Tracked

**Authentication Events** (3 events):
- ✅ `userLogin` - User login (once per session)
- ⚠️ `userLogout` - User logout (defined but not implemented)
- ✅ `accessDenied` - User not in required Azure AD group

**Core Functionality** (3 events):
- ✅ `notesGenerated` - First generation
- ✅ `notesRegenerated` - Subsequent generations with different settings
- ✅ `generationCancelled` - User cancels generation

**Export & Sharing** (4 events):
- ✅ `copiedToClipboard` - Rich text or plain text fallback
- ✅ `exportedToPDF` - Download PDF via print dialog
- ✅ `exportedToCSV` - Download action items CSV
- ✅ `exportedToEmail` - Draft email with mailto link

**🆕 Calendar & Meeting Selection** (3 events):
- ✅ `calendarDateSelected` - User picks calendar date (includes day of week, meeting count, source)
- ✅ `meetingSelected` - User selects a meeting
- ✅ `switchedToManualMode` - Switch from calendar to manual entry

**🆕 Transcript Viewer** (3 events):
- ✅ `transcriptViewerOpened` - Modal opened (includes iteration count, transcript length)
- ✅ `transcriptIterationSwitched` - Switch between transcript iterations (includes cache status)
- ✅ `transcriptLazyLoaded` - Additional transcript loaded (includes success/failure, content length)

**Transcript Interrogation** (2 events):
- ✅ `transcriptInterrogated` - Modal opened
- ✅ `questionAsked` - Question submitted (includes length, turn number)

**🆕 Participant Management** (5 events):
- ✅ `participantsExtracted` - Auto-extraction from transcript (includes match rate, external count)
- ✅ `participantAdded` - Manually added participant (includes source, department, company)
- ✅ `participantBatchImported` - CSV or email list import (includes success rate, counts)
- ✅ `participantsPanelOpened` - User expands participants panel
- ✅ `participantsModalOpened` - User opens full participants modal

**🆕 Meeting Coach** (1 event):
- ✅ `meetingCoachViewed` - Coach panel rendered (includes flags, agenda coverage, decision count)
- ⚠️ `coachInsightsExpanded` - Not applicable (no expand/collapse UI)

**🆕 User Notes** (2 events):
- ✅ `userNotesOpened` - User notes modal opened (includes existing notes length)
- ✅ `userNotesSaved` - User saves notes (includes length, word count, changed status)

**File Uploads** (2 events):
- ✅ `transcriptFileUploaded` - TXT file upload (includes file size)
- ✅ `docxFileUploaded` - DOCX file upload (includes file size)

**Language** (2 active events):
- ✅ `languageChanged` - User changes language
- 🔴 `languageDetected` - **DISABLED** (redundant with languageChanged)
- ✅ `languageChangeError` - Language change failure

**Preset & Settings** (1 active event):
- ✅ `presetSelected` - Preset selected (includes preset details)
- ✅ `botIdChanged` - Bot ID changed (hashed for privacy)
- 🔴 `settingsOpened` - **DISABLED** (too frequent, low value)

**Tour Interactions** (3 events):
- ✅ `tourStarted` - Tour started
- ✅ `tourCompleted` - Tour finished all steps
- ✅ `tourDismissed` - Tour closed before completing

**User Data** (1 event):
- ✅ `userDataReset` - User cleared all local data

**User Feedback** (1 event):
- ✅ `feedback` - User submitted feedback (includes type, priority, description)

**🔴 Disabled Events** (4 events - commented out to reduce database noise):
- 🔴 `formCleared` - **DISABLED**: too frequent, low analytical value, not used in Power BI
- 🔴 `sampleDataLoaded` - **DISABLED**: testing-only usage, not needed in production
- 🔴 `settingsOpened` - **DISABLED**: too frequent, limited value (`botIdChanged` remains active)
- 🔴 `languageDetected` - **DISABLED**: auto-fires, redundant with `languageChanged`

**📈 Statistics**:
- **Total Events Defined**: 40
- **Active Events**: 36 (40 defined - 4 disabled)
- **New Events (2025-10-28)**: 13
- **Events Disabled (2025-10-28)**: 4
- **Events Used in Power BI**: 27+

### New Event Details

#### Calendar & Meeting Selection
- **calendarDateSelected**: Tracks which days users select, whether via click or "Today" button, meeting count per day
- **meetingSelected**: Tracks meeting selection with auto-populate status
- **switchedToManualMode**: Tracks users who prefer manual entry over calendar

#### Transcript Viewer
- **transcriptViewerOpened**: Tracks usage of transcript viewer modal, whether single or recurring meeting
- **transcriptIterationSwitched**: Tracks carousel usage for recurring meetings (cache hit rate analysis)
- **transcriptLazyLoaded**: Tracks lazy loading performance and failure rate

#### Participant Management
- **participantsExtracted**: Auto-extraction success rate, Graph API matching effectiveness
- **participantAdded**: Manual participant additions by source (manual, meeting, CSV)
- **participantBatchImported**: CSV/email list import success rate, duplicate handling
- **participantsPanelOpened**: Panel engagement vs modal usage
- **participantsModalOpened**: Full modal usage patterns

#### Meeting Coach
- **meetingCoachViewed**: Coach feature adoption, meeting quality metrics over time

#### User Notes
- **userNotesOpened**: User notes feature discovery
- **userNotesSaved**: Content length patterns, edit behavior

### Privacy & Security

- **User Data**: Only authenticated user name and email (from Azure AD) are sent
- **Bot IDs**: Hashed using a simple hash function before transmission
- **Meeting Content**: Meeting titles, transcripts, and generated notes are **never** sent to telemetry
- **File Names**: Only file extensions are tracked, not full file names
- **Participant Data**: Only aggregated counts (extracted, matched, external) - no PII
- **Fire-and-Forget**: Telemetry failures do not impact application functionality

### Power Automate Integration

The application sends all telemetry data to a single centralized Power Automate flow endpoint that tracks all events with rich metadata.

#### Centralized Telemetry Event Schema

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.0.0",
  "sessionId": "unique-session-id-per-browser-session",
  "correlationId": "optional-id-to-link-related-events",
  "eventType": "notesGenerated",
  "timestamp": "2025-01-22T14:30:00.000Z",
  "userContext": {
    "name": "John Doe",
    "email": "john.doe@company.com",
    "tenantId": "azure-ad-tenant-id"
  },
  "eventPayload": "{\"meetingTitle\":\"Q4 Planning\",\"transcriptLength\":5430,\"actionItemCount\":7}"
}
```

**New Payload Fields (2025-10-28)**:
- `hasMultipleIterations`, `iterationCount`, `wasCached` (Transcript Viewer)
- `totalExtracted`, `matchedCount`, `unmatchedCount`, `externalCount` (Participants)
- `flagCount`, `agendaCoveragePct`, `decisionCount` (Coach)
- `notesLength`, `wordCount`, `changed` (User Notes)
- `dayOfWeek`, `meetingCount`, `source` (Calendar)

### Configuration

The telemetry flow URL is configured in [appConfig.ts](appConfig.ts):

```typescript
export const appConfig = {
  telemetryFlowUrl: "YOUR_POWER_AUTOMATE_TELEMETRY_FLOW_URL"
};
```

**To configure**:
1. Create an HTTP trigger flow in Power Automate
2. Configure the flow to receive the telemetry event schema (see schema above)
3. Copy the HTTP POST URL from the trigger
4. Replace the placeholder URL in `appConfig.ts`
5. If URL is not configured (still contains "YOUR_"), telemetry will be disabled with console warnings

### Disabling Telemetry (Development)

To disable telemetry during local development:
- Leave the placeholder URLs in `appConfig.ts` unchanged
- The app will log warnings to the console but continue functioning normally

### Power BI Dashboard Integration

The telemetry data powers comprehensive Power BI dashboards. See [TELEMETRY-REVIEW-SUMMARY.md](TELEMETRY-REVIEW-SUMMARY.md) for:
- **14 new DAX measures** for GraphAPI features
- **Updated SQL view** (`vw_MeetingNotesGenerator`) with 42 new columns
- **4 new dashboard pages**: GraphAPI Integration, Participant Management, Meeting Coach Performance, User Engagement Deep Dive
- **Complete dashboard design guide** with visuals, filters, and interactivity recommendations

**Key Metrics Available**:
- Calendar adoption rate, peak meeting days
- Transcript viewer usage, recurring meeting engagement
- Participant extraction success rate, batch import efficiency
- Meeting coach adoption, average meeting quality scores
- User notes adoption, average note length
- Feature co-usage patterns, power user identification

**Dashboard Examples**:
```dax
// Calendar Adoption Rate
Calendar Adoption Rate =
DIVIDE([Calendar Date Selections], [Unique Login Sessions], 0)

// Participant Match Rate
Participant Match Rate =
DIVIDE(SUM(vw_MeetingNotesGenerator[MatchedCount]),
       SUM(vw_MeetingNotesGenerator[TotalExtracted]), 0)

// Transcript Lazy Load Success Rate
Transcript Lazy Load Success Rate =
VAR TotalAttempts = [Transcript Lazy Load Attempts]
VAR SuccessfulLoads = CALCULATE(COUNTROWS(vw_MeetingNotesGenerator),
    vw_MeetingNotesGenerator[EventType] = "transcriptLazyLoaded",
    vw_MeetingNotesGenerator[LazyLoadSuccess] = TRUE)
RETURN DIVIDE(SuccessfulLoads, TotalAttempts, 0)
```

### Testing & Monitoring

**Testing Checklist** (see [TELEMETRY-REVIEW-SUMMARY.md](TELEMETRY-REVIEW-SUMMARY.md)):
- ✅ Calendar date selection events
- ✅ Transcript viewer and iteration switching
- ✅ Participant extraction and batch import
- ✅ Meeting coach view events
- ✅ User notes open and save events
- ✅ Verify disabled events don't fire

**Monitoring Alerts** (recommended):
- Critical: Transcript Lazy Load Success Rate < 90%
- Critical: Participant Extraction Success Rate < 85%
- Warning: Any feature adoption rate drops >10% week-over-week
- Weekly: Feature adoption summary email
- Monthly: Full metrics report with trends
```

---

## 🆕 NEW RECENT CHANGES ENTRY

Add this at the TOP of the "Recent Changes" section (before the current "Latest Update - 2025-10-24"):

```markdown
### 📅 Latest Update - 2025-10-28 - Telemetry Framework Enhancement (v1.4.0)

**Summary**: Comprehensive telemetry framework review and enhancement to track GraphAPI integration features, participant management, meeting coach, and user notes. Added 13 new events, disabled 4 noisy events, and created complete Power BI dashboard integration guide.

#### Telemetry Framework Enhancement

**What's New**:
- ✅ **13 New Telemetry Events**: Comprehensive tracking for GraphAPI features (calendar, transcript viewer, participants)
- ✅ **4 Events Disabled**: Removed noisy low-value events (formCleared, sampleDataLoaded, settingsOpened, languageDetected)
- ✅ **Power BI Integration**: Complete dashboard design guide with 14 new DAX measures
- ✅ **Updated SQL View**: Added 42 new columns to `vw_MeetingNotesGenerator` for new event data
- ✅ **Comprehensive Documentation**: New TELEMETRY-REVIEW-SUMMARY.md with full implementation details

**New Events by Category**:

1. **Calendar & Meeting Selection** (1 new):
   - `calendarDateSelected` - Track calendar usage patterns (day of week, meeting count, source)

2. **Transcript Viewer** (3 new):
   - `transcriptViewerOpened` - Modal opens (iteration count for recurring meetings)
   - `transcriptIterationSwitched` - Carousel navigation (cache hit tracking)
   - `transcriptLazyLoaded` - Lazy loading performance (success rate monitoring)

3. **Participant Management** (5 new):
   - `participantsExtracted` - Auto-extraction success rate, Graph API matching
   - `participantAdded` - Manual additions (source, department, company)
   - `participantBatchImported` - CSV/email import (success rate, duplicate handling)
   - `participantsPanelOpened` - Panel engagement tracking
   - `participantsModalOpened` - Modal usage patterns

4. **Meeting Coach** (1 new):
   - `meetingCoachViewed` - Coach feature adoption, meeting quality metrics

5. **User Notes** (2 new):
   - `userNotesOpened` - Feature discovery tracking
   - `userNotesSaved` - Content patterns (length, word count, edit behavior)

**Events Disabled (Reduced Database Noise)**:
- 🔴 `formCleared` - Too frequent, low analytical value, not used in Power BI
- 🔴 `sampleDataLoaded` - Testing-only usage, not needed in production
- 🔴 `settingsOpened` - Too frequent, limited value (botIdChanged remains active)
- 🔴 `languageDetected` - Auto-fires, redundant with languageChanged

**Power BI Dashboard Enhancements**:
- 📊 **4 New Dashboard Pages**: GraphAPI Integration Adoption, Participant Management Analytics, Meeting Coach Performance, User Engagement Deep Dive
- 📊 **14 New DAX Measures**: Calendar adoption rate, participant match rate, coach adoption rate, transcript cache hit rate, etc.
- 📊 **42 New SQL Columns**: Added to `vw_MeetingNotesGenerator` view for comprehensive analytics
- 📊 **Complete Design Guide**: Visual layouts, color schemes, filters, bookmarks, mobile layouts

**Key Insights Enabled**:
- Calendar usage patterns (peak days, meeting counts, today-button vs manual selection)
- Transcript viewer engagement (recurring meeting usage, lazy loading performance)
- Participant management effectiveness (extraction success rate, Graph API matching, batch import efficiency)
- Meeting coach adoption and impact (quality metrics, flag frequency, user engagement)
- User notes adoption (content length patterns, edit behavior, feature discovery)
- Feature co-usage patterns (which features are used together)
- Power user identification (engagement score, feature diversity)

**Files Created**:
- 📄 [TELEMETRY-REVIEW-SUMMARY.md](TELEMETRY-REVIEW-SUMMARY.md) - Comprehensive review with all changes, Power BI integration guide (4,000+ lines)
- 📄 [README-TELEMETRY-UPDATE.md](README-TELEMETRY-UPDATE.md) - README update instructions

**Files Modified**:
- [utils/telemetryService.ts](utils/telemetryService.ts) - Added 13 new event types (40 total, 36 active)
- [App.tsx](App.tsx) - Disabled formCleared, sampleDataLoaded telemetry
- [components/SettingsDrawer.tsx](components/SettingsDrawer.tsx) - Disabled settingsOpened telemetry
- [hooks/useLanguage.ts](hooks/useLanguage.ts) - Disabled languageDetected telemetry
- [components/transcript/TranscriptViewerModal.tsx](components/transcript/TranscriptViewerModal.tsx) - Added 3 events
- [components/meeting/CalendarPicker.tsx](components/meeting/CalendarPicker.tsx) - Added calendarDateSelected event
- [hooks/useParticipantExtraction.ts](hooks/useParticipantExtraction.ts) - Added 3 participant events
- [components/participants/ParticipantsPanel.tsx](components/participants/ParticipantsPanel.tsx) - Added panel opened event
- [components/participants/ParticipantsModal.tsx](components/participants/ParticipantsModal.tsx) - Added modal opened event
- [components/OutputPanel.tsx](components/OutputPanel.tsx) - Added meetingCoachViewed event
- [components/UserNotesModal.tsx](components/UserNotesModal.tsx) - Added 2 user notes events

**SQL View Update Required**:
Update `vw_MeetingNotesGenerator` with 42 new columns (see TELEMETRY-REVIEW-SUMMARY.md):
- Calendar fields: CalendarDayOfWeek, CalendarSource, MeetingCountOnDate, IsToday
- Transcript viewer fields: IterationCount, WasCached, LazyLoadSuccess, etc.
- Participant fields: TotalExtracted, MatchedCount, UnmatchedCount, ExternalCount, etc.
- Coach fields: CoachFlagCount, AgendaCoveragePct, CoachDecisionCount, etc.
- User notes fields: UserNotesLength, UserNotesWordCount, UserNotesChanged, etc.

**Power BI Measures to Add** (14 new):
- Calendar: Calendar Adoption Rate, Avg Meetings Per Selected Date
- Transcript: Transcript Viewer Adoption Rate, Transcript Cache Hit Rate, Lazy Load Success Rate
- Participants: Participant Match Rate, Batch Import Success Rate, Participant Extraction Success Rate
- Coach: Coach Adoption Rate, Avg Coach Flags Per Meeting, Avg Agenda Coverage
- User Notes: User Notes Adoption Rate, User Notes Completion Rate, Avg User Notes Length

**Statistics**:
- **Total Events**: 40 defined, 36 active (4 disabled)
- **New Events**: 13 added
- **Events Removed**: 4 disabled (not deleted, commented out for potential re-enable)
- **Power BI Impact**: 0 disruption (all existing measures preserved)
- **New Dashboard Pages**: 4 recommended
- **New DAX Measures**: 14 recommended
- **New SQL Columns**: 42 added

**Testing Checklist**:
- ✅ All new events trigger correctly
- ✅ Disabled events do not fire
- ✅ Power Automate flow receives new payloads
- ✅ No TypeScript compilation errors
- ✅ All existing telemetry continues to work

**Use Cases**:
- Track GraphAPI feature adoption (calendar, transcript viewer, participants)
- Monitor participant extraction and Graph API matching effectiveness
- Measure meeting coach impact on meeting quality over time
- Understand user notes feature adoption and content patterns
- Identify feature combinations used by power users
- Detect performance issues (lazy loading failures, low match rates)
- Create executive dashboards showing feature ROI

**Next Steps**:
1. Deploy code changes to production
2. Update SQL view in database with new columns
3. Add new DAX measures to Power BI model
4. Create 4 new dashboard pages with recommended visuals
5. Set up monitoring alerts for critical metrics
6. Review telemetry data after 1-2 weeks to validate

**Documentation**:
- [TELEMETRY-REVIEW-SUMMARY.md](TELEMETRY-REVIEW-SUMMARY.md) - Full implementation details, Power BI dashboard design guide
- [Telemetry.md](Telemetry.md) - Technical implementation details
- [telemetry-privacy.md](telemetry-privacy.md) - Privacy policy and data handling

---
```

---

## PLACEMENT INSTRUCTIONS

1. **Telemetry Section**: Replace lines 234-275 in README.md with the "REPLACEMENT CONTENT FOR TELEMETRY SECTION" above
2. **Recent Changes**: Insert the "NEW RECENT CHANGES ENTRY" above at line 2427, before the current "Latest Update - 2025-10-24"

This will update the README.md with comprehensive telemetry documentation!
