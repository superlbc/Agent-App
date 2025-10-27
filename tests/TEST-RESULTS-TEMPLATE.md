# Graph API Test Results

**Date:** [YYYY-MM-DD]
**Tenant:** [Your Organization]
**Tenant ID:** [Azure AD Tenant ID]
**Tested By:** [Your Name]

---

## Environment Details

| Property | Value |
|----------|-------|
| **Organization** | IPG / Momentum Worldwide |
| **Microsoft 365 Plan** | [E3 / E5 / Business Premium / etc.] |
| **Teams Recording Enabled** | [Yes / No] |
| **Transcription Enabled** | [Yes / No] |
| **Auto-save Location** | [OneDrive / SharePoint / Not Configured] |

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| ✅ User Profile | PASS/FAIL | |
| ✅ Calendar Events | PASS/FAIL | |
| ✅ Meeting Details | PASS/FAIL | |
| ✅ Transcript Strategy 1 (API) | PASS/FAIL | |
| ✅ Transcript Strategy 2 (OneDrive) | PASS/FAIL | |
| ✅ Transcript Strategy 3 (Teams Files) | PASS/FAIL | |

**Total Passed:** X / 6

---

## Test 1: User Profile (/me)

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me`

**Required Permission:** `User.Read`

**Status:** ✅ PASS / ❌ FAIL

**Response:**
```json
{
  "displayName": "John Smith",
  "mail": "john.smith@momentum.com",
  "userPrincipalName": "john.smith@momentum.com",
  "jobTitle": "Senior Developer"
}
```

**Notes:**
- [Any observations]

---

## Test 2: Calendar Events (/me/calendar/calendarView)

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me/calendar/calendarView`

**Required Permission:** `Calendars.Read`

**Status:** ✅ PASS / ❌ FAIL

**Response Summary:**
- Total events found: [X]
- Teams meetings found: [X]
- Sample meeting: "[Meeting Subject]"

**Sample Event:**
```json
{
  "id": "AAMkAGZm...",
  "subject": "Weekly Standup",
  "start": { "dateTime": "2025-10-21T10:00:00" },
  "end": { "dateTime": "2025-10-21T10:30:00" },
  "organizer": { "emailAddress": { "address": "organizer@momentum.com" }},
  "onlineMeeting": {
    "joinUrl": "https://teams.microsoft.com/l/meetup-join/..."
  }
}
```

**Notes:**
- [Any observations]

---

## Test 3: Meeting Details (/me/events/{id})

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me/events/{eventId}`

**Required Permission:** `Calendars.Read`

**Status:** ✅ PASS / ❌ FAIL

**Response Summary:**
- Meeting subject: "[Subject]"
- Attendees: [X]
- Has online meeting: [Yes / No]
- Body/agenda present: [Yes / No]

**Notes:**
- [Any observations]

---

## Test 4: Transcript Strategy 1 - OnlineMeetings API

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me/onlineMeetings/{meetingId}/transcripts`

**Required Permission:** `OnlineMeetingTranscript.Read`

**Status:** ✅ PASS / ❌ FAIL

### If PASS:
**Response:**
```json
{
  "value": [
    {
      "id": "transcript-id",
      "meetingId": "meeting-id",
      "createdDateTime": "2025-10-21T10:35:00Z"
    }
  ]
}
```

**Transcript Count:** [X]

**Can Fetch Content:** [Yes / No]

**Content Endpoint:** `GET /me/onlineMeetings/{meetingId}/transcripts/{transcriptId}/content`

**Content Format:** [VTT / DOCX / TXT]

### If FAIL:
**Error Code:** [403 / 404 / 401 / etc.]

**Error Message:**
```json
{
  "error": {
    "code": "Forbidden",
    "message": "Insufficient privileges to complete the operation."
  }
}
```

**Reason:**
- [ ] Permission not granted
- [ ] Meeting doesn't have transcript
- [ ] Endpoint not supported with delegated permissions
- [ ] Other: [Describe]

**Notes:**
- [Any observations]

---

## Test 5: Transcript Strategy 2 - OneDrive

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me/drive/root:/Recordings:/children`

**Required Permission:** `Files.Read`

**Status:** ✅ PASS / ❌ FAIL

### If PASS:
**Files Found:** [X]

**Transcript Files:** [X]

**Sample Filenames:**
- `Meeting Title-20251021_100530-Meeting Recording.vtt`
- `[filename 2]`
- `[filename 3]`

**File Naming Pattern:** [Describe the pattern observed]

**Can Download Content:** [Yes / No]

### If FAIL:
**Error Code:** [404 / 403 / etc.]

**Error Message:**
```json
{
  "error": {
    "code": "itemNotFound",
    "message": "The resource could not be found."
  }
}
```

**Reason:**
- [ ] Recordings folder doesn't exist
- [ ] Auto-save not enabled in Teams admin
- [ ] Transcripts saved elsewhere
- [ ] Other: [Describe]

**Notes:**
- [Any observations]

---

## Test 6: Transcript Strategy 3 - Teams Chat Files

**Endpoint:** `GET https://graph.microsoft.com/v1.0/me/drive/root:/Microsoft Teams Chat Files:/children`

**Required Permission:** `Files.Read`

**Status:** ✅ PASS / ❌ FAIL

### If PASS:
**Files Found:** [X]

**Transcript Files:** [X]

**Sample Filenames:**
- `[filename 1]`
- `[filename 2]`

### If FAIL:
**Error Code:** [404 / 403 / etc.]

**Error Message:**
```json
{
  "error": {
    "code": "itemNotFound",
    "message": "The resource could not be found."
  }
}
```

**Notes:**
- [Any observations]

---

## Recommendations

### ✅ What Works

[List all endpoints/strategies that worked]

Example:
- ✅ Calendar access works perfectly
- ✅ Meeting details accessible
- ✅ Transcripts available via OneDrive strategy

### ❌ What Doesn't Work

[List all endpoints/strategies that failed]

Example:
- ❌ OnlineMeetings transcript API returns 403 (permission denied)
- ❌ OneDrive Recordings folder doesn't exist

### 🎯 Recommended Implementation Strategy

**For Calendar & Meeting Details:**
[Describe approach]

Example:
> Use direct Graph API (`/me/calendar/calendarView` and `/me/events/{id}`) as primary method. These endpoints work reliably with `Calendars.Read` permission.

**For Transcripts:**
[Describe approach]

Example:
> **Strategy 2 (OneDrive)** is recommended:
> 1. Search `/me/drive/root:/Recordings:/children` for files matching meeting subject
> 2. Filter by filename containing "transcript"
> 3. Download file content
> 4. Parse VTT format
>
> **Fallback:** If OneDrive search fails, use Power Automate flow to proxy the request with user's delegated permissions, or fall back to manual paste.

### 🔐 Permissions Required

Based on test results, request the following permissions from IT:

**Minimum (Essential):**
- [ ] `User.Read` - User profile
- [ ] `Calendars.Read` - Calendar access
- [ ] `Files.Read` - OneDrive/SharePoint access

**Recommended (Enhanced Experience):**
- [ ] `OnlineMeetings.Read` - Meeting details
- [ ] `OnlineMeetingTranscript.Read` - Direct transcript access (if Strategy 1 works)

**Note:** If `OnlineMeetingTranscript.Read` is denied, the OneDrive strategy (Strategy 2) provides equivalent functionality.

---

## Power Automate Fallback Required?

**Decision:** [YES / NO]

**Reasoning:**
[Explain why Power Automate is or isn't needed]

Example:
> YES - The OnlineMeetings transcript API requires admin consent which has been denied. We will deploy Power Automate Flow #2 to access transcripts via OneDrive using user's delegated permissions.

---

## Teams Admin Settings to Verify

Based on test results, IT should verify these settings:

### Teams Recording Settings
- [ ] Meeting recording is enabled
- [ ] Cloud recording storage location: [OneDrive / SharePoint / ?]
- [ ] Recording expiration policy: [Days / Never]

### Teams Transcription Settings
- [ ] Live transcription enabled
- [ ] Post-meeting transcription enabled
- [ ] Auto-save transcripts: [Enabled / Disabled]
- [ ] Transcript save location: [With recording / Separate]

### OneDrive/SharePoint Settings
- [ ] User storage quota sufficient for recordings
- [ ] Sharing settings allow API access

---

## Next Steps

- [ ] 1. Request necessary API permissions from IT
- [ ] 2. Decide on transcript strategy based on test results
- [ ] 3. Configure Power Automate flows if needed
- [ ] 4. Implement MeetingService with chosen strategy
- [ ] 5. Add fallback logic for failed scenarios
- [ ] 6. Test end-to-end in production environment

---

## Additional Notes

[Any other observations, edge cases, or important findings]

---

**Test Completed By:** [Your Name]
**Date:** [YYYY-MM-DD]
**Signature:** _______________
