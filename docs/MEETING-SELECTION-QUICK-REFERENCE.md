# Meeting Selection - Quick Reference

**Quick Links:**
- [Full Technical Specification](./MEETING-SELECTION-ARCHITECTURE.md)
- [Agent System Prompt v3.1](./AGENT-SYSTEM-PROMPT-V3.1-STREAMLINED.md)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                                                                     │
│  ┌───────────────────────┐      ┌───────────────────────┐         │
│  │  TAB 1: SELECT MEETING│      │ TAB 2: PASTE TRANSCRIPT│         │
│  │                       │      │                        │         │
│  │  1. Calendar Picker   │      │  1. Meeting Title      │         │
│  │  2. Meeting List      │      │  2. Agenda             │         │
│  │  3. Auto-populate     │      │  3. Transcript         │         │
│  │                       │      │  4. Participants       │         │
│  └───────────┬───────────┘      └────────────────────────┘         │
│              │                                                      │
└──────────────┼──────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              MeetingService (Orchestrator)                     │ │
│  │  • getCalendarMeetings()                                       │ │
│  │  • getMeetingWithTranscript()                                  │ │
│  │  • preloadCalendar() ← called on login                         │ │
│  └──────────────────────────┬─────────────────────────────────────┘ │
│                             │                                        │
│                    Try Primary ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │             GraphService (Microsoft Graph API)                 │ │
│  │  • /me/calendar/calendarView                                   │ │
│  │  • /me/events/{id}                                             │ │
│  │  • /me/onlineMeetings/{id}/transcripts                         │ │
│  └──────────────────────────┬─────────────────────────────────────┘ │
│                             │                                        │
│                    If 403 ▼ Fallback to Power Automate              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │      PowerAutomateService (Fallback via Flows)                 │ │
│  │  • Flow 1: Get Calendar                                        │ │
│  │  • Flow 2: Get Meeting Details + Transcript                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     MICROSOFT 365 BACKEND                            │
│                                                                      │
│  [Calendar Events] [Meeting Details] [Transcripts] [OneDrive]       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## User Journey Flow

### Path A: Select Meeting (Automated)

```
User clicks "Generate Notes"
  ↓
[Check Auth Status]
  ↓ Authenticated
Load Tab 1 (Select Meeting)
  ↓
[Background: Load calendar from cache or API]
  ↓
Display calendar picker (default: current week)
  ↓
User selects date
  ↓
Show meeting list for that day
  ┌─────────────────────────────────┐
  │ 10:00 AM - Weekly Standup       │
  │ ✅ Transcript Available          │
  ├─────────────────────────────────┤
  │ 2:00 PM - Client Review         │
  │ ⏳ Transcript Processing...      │
  ├─────────────────────────────────┤
  │ 4:00 PM - Design Sync           │
  │ ❌ No Transcript                 │
  └─────────────────────────────────┘
  ↓
User clicks meeting
  ↓
[Fetch meeting details + transcript]
  ↓
Auto-populate form:
  • Meeting Title: ✅
  • Agenda: ✅
  • Transcript: ✅ (if available)
  • Participants: ✅
  ↓
User clicks "Generate Meeting Notes"
  ↓
[Process with AI Agent - existing flow]
```

### Path B: Paste Transcript (Manual)

```
User clicks "Paste Transcript" tab
  ↓
Display manual form
  ↓
User fills:
  • Meeting Title
  • Agenda
  • Transcript (copy/paste)
  • Select Participants
  ↓
User clicks "Generate Meeting Notes"
  ↓
[Process with AI Agent - existing flow]
```

---

## State Management Strategy

### Session Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│ LOGIN EVENT                                                    │
│   ↓                                                            │
│ 1. Acquire access token (valid 1 hour)                        │
│ 2. Start token refresh timer (refresh every 55 min)           │
│ 3. Pre-load calendar (background fetch)                       │
│ 4. Cache results in sessionStorage (TTL: 15 min)              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ USER INACTIVE FOR HOURS                                        │
│   ↓                                                            │
│ Token auto-refreshes (every 55 min)                           │
│ Cache expires after 15 min of inactivity                      │
│   ↓                                                            │
│ USER RETURNS TO TAB                                            │
│   ↓                                                            │
│ visibilitychange event fires                                  │
│   ↓                                                            │
│ Check cache validity                                          │
│   ├─ Valid → Use cached data                                  │
│   └─ Expired → Re-fetch calendar (automatic)                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ TOKEN REFRESH FAILS (user logged out elsewhere, etc.)         │
│   ↓                                                            │
│ Show re-auth prompt                                           │
│   ↓                                                            │
│ User clicks "Refresh Session"                                 │
│   ↓                                                            │
│ Trigger MSAL login flow                                       │
│   ↓                                                            │
│ On success → Resume calendar access                           │
│ On failure → Auto-switch to Tab 2 (Paste Transcript)          │
└────────────────────────────────────────────────────────────────┘
```

### Cache Management

**Cache Key:** `meetings_cache_${userId}`

**Cache Structure:**
```json
{
  "meetings": [...],
  "timestamp": 1730000000000,
  "userId": "user@momentum.com"
}
```

**Cache Rules:**
- ✅ Valid for 15 minutes
- ✅ Cleared on logout
- ✅ Cleared on user ID mismatch (security)
- ✅ Invalidated on visibility change + expired
- ✅ Stored in sessionStorage (not localStorage - security)

---

## API Requirements

### Microsoft Graph API

**Permissions Required:**

| Permission | Scope | Admin Consent? | Priority |
|------------|-------|----------------|----------|
| `User.Read` | Read user profile | ❌ No | 🔴 Critical |
| `Calendars.Read` | Read calendar | ❌ No | 🔴 Critical |
| `OnlineMeetings.Read` | Read meeting details | ⚠️ Maybe | 🟡 High |
| `OnlineMeetingTranscript.Read` | Read transcripts | ✅ Yes | 🟢 Nice-to-have |

**Endpoints Used:**

1. **Get Calendar View**
   ```
   GET /me/calendar/calendarView
     ?startDateTime={ISO8601}
     &endDateTime={ISO8601}
     &$select=subject,start,end,organizer,attendees,onlineMeeting
     &$top=50
   ```

2. **Get Meeting Details**
   ```
   GET /me/events/{eventId}
     ?$select=subject,start,end,organizer,attendees,body,location
   ```

3. **Get Transcript (NEEDS TESTING IN YOUR TENANT)**
   ```
   GET /me/onlineMeetings/{meetingId}/transcripts
   GET /me/onlineMeetings/{meetingId}/transcripts/{transcriptId}/content

   OR (fallback):

   GET /me/drive/root:/Recordings:/children
   GET /me/drive/items/{fileId}/content
   ```

---

## Error Handling Matrix

| Error | HTTP Code | User Message | System Action |
|-------|-----------|--------------|---------------|
| Token expired | 401 | "Session expired. Please refresh." | Show re-auth modal |
| Permission denied | 403 | "Using alternative method..." | Fallback to Power Automate |
| Transcript not found | 404 | "No transcript available. Please paste manually." | Offer manual paste |
| Transcript processing | 200 (status: processing) | "Transcript still being processed. Try again in 5 min." | Show retry button |
| Network timeout | ETIMEDOUT | "Network error. Retrying... (2/3)" | Exponential backoff retry |
| Rate limited | 429 | "Temporarily rate-limited. Retrying in 30s..." | Wait + retry |
| All methods fail | - | "Unable to access calendar. Please use manual paste." | Auto-switch to Tab 2 |

---

## Implementation Checklist

### Phase 1: Foundation ✅ (Week 1-2)
- [ ] Configure Azure AD app registration
- [ ] Install `@microsoft/microsoft-graph-client` and `@azure/msal-browser`
- [ ] Create `AuthService` with MSAL integration
- [ ] Create `GraphService` with basic endpoints
- [ ] Test Graph API in IPG tenant (document which transcript endpoint works)
- [ ] Implement error handling and retry logic

### Phase 2: UI Components 🎨 (Week 2-3)
- [ ] Create `TabContainer` component (Radix UI Tabs)
- [ ] Create `CalendarPicker` component (date selector)
- [ ] Create `MeetingListCard` component (shows meeting + transcript badge)
- [ ] Update existing paste form to work in Tab 2
- [ ] Add loading states (Skeleton components)
- [ ] Add transcript availability badges (✅ Available, ⏳ Processing, ❌ None)

### Phase 3: Data Integration 🔌 (Week 3-4)
- [ ] Implement `MeetingService.preloadCalendar()` (called on login)
- [ ] Implement `MeetingService.getCalendarMeetings()`
- [ ] Implement `MeetingService.getMeetingWithTranscript()`
- [ ] Create `CacheService` (sessionStorage management)
- [ ] Connect UI to services
- [ ] Auto-populate form fields on meeting selection
- [ ] Handle transcript not available scenarios

### Phase 4: Power Automate Fallback ⚡ (Week 4-5)
- [ ] Create Power Automate Flow #1: Get Calendar
- [ ] Create Power Automate Flow #2: Get Meeting Details
- [ ] Create Power Automate Flow #3: Get Transcript (via OneDrive)
- [ ] Create `PowerAutomateService`
- [ ] Implement fallback logic in `MeetingService`
- [ ] Test in environment without Graph API permissions

### Phase 5: Session Management 🔐 (Week 5-6)
- [ ] Implement token refresh timer (55 min interval)
- [ ] Implement cache invalidation (15 min TTL)
- [ ] Add `visibilitychange` listener (detect tab return)
- [ ] Create re-authentication modal
- [ ] Test with 3-day-old session
- [ ] Implement graceful degradation (auto-switch to Tab 2)

### Phase 6: Polish & Testing ✨ (Week 6-7)
- [ ] Add comprehensive error messages (all scenarios)
- [ ] Implement retry logic with exponential backoff
- [ ] Add loading skeletons for all async operations
- [ ] Write unit tests for services
- [ ] Write integration tests for flows
- [ ] Conduct user testing
- [ ] Write user documentation

---

## Key Decision Points

### 🚨 MUST DECIDE BEFORE STARTING:

**1. Which transcript endpoint works in IPG tenant?**
- Test all three strategies (see API Requirements section)
- Document which one works
- Build primary logic around working endpoint

**2. Will IT approve `OnlineMeetingTranscript.Read` permission?**
- ✅ **If YES:** Use Graph API (optimal UX)
- ❌ **If NO:** Deploy Power Automate flows (fallback)
- 🤷 **If MAYBE:** Build both, prioritize Graph API

**3. Is auto-save to OneDrive enabled for Teams meetings?**
- ✅ **If YES:** OneDrive fallback strategy will work
- ❌ **If NO:** Only Power Automate HTTP → Graph API will work
- 🤷 **If UNKNOWN:** Test both in tenant

**4. Should Power Automate flows be deployed proactively or only if Graph API denied?**
- **Recommendation:** Deploy proactively as insurance policy
- Minimal cost (free tier sufficient)
- Provides fallback for restrictive environments

---

## Quick Code Reference

### How to call from UI:

```typescript
// In Generate Notes component
const meetingService = new MeetingService();

// On date selection
const handleDateSelect = async (date: Date) => {
  const meetings = await meetingService.getCalendarMeetings(
    startOfDay(date).toISOString(),
    endOfDay(date).toISOString()
  );

  setMeetings(meetings);
};

// On meeting selection
const handleMeetingSelect = async (meetingId: string) => {
  setLoading(true);

  try {
    const details = await meetingService.getMeetingWithTranscript(meetingId);

    // Auto-populate form
    setMeetingTitle(details.title);
    setAgenda(details.agenda);
    setTranscript(details.transcript?.content || '');
    setParticipants(details.attendeesDetailed);

    if (!details.transcript?.available) {
      toast.warning('Transcript not available. Please paste manually.');
    }
  } catch (error) {
    toast.error('Failed to load meeting. Please try manual paste.');
    setActiveTab('paste-transcript');
  } finally {
    setLoading(false);
  }
};
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Calendar pre-load | < 3 seconds | Background on login |
| Calendar from cache | < 500ms | Instant on tab open |
| Meeting details | < 2 seconds | Parallel requests |
| Transcript fetch | < 5 seconds | Depends on file size |
| Power Automate fallback | < 8 seconds | Flow execution overhead |
| UI responsiveness | 60 FPS | Virtual scrolling for long lists |

---

## Support Contact

**Questions about implementation?**
- Refer to [Full Technical Specification](./MEETING-SELECTION-ARCHITECTURE.md)
- Test transcript endpoints in your tenant first
- Document findings in tenant-specific notes

**Questions for IT:**
1. Which Graph API transcript endpoint works in your tenant?
2. Is auto-save to OneDrive enabled for Teams?
3. Can we get admin consent for `OnlineMeetingTranscript.Read`?
4. Should we deploy Power Automate flows as backup?

---

**Last Updated:** 2025-10-27
**Version:** 1.0
