# Power Automate Flow Definitions

**Purpose:** Fallback solution when Microsoft Graph API permissions are denied by IT.

---

## Flow 1: Get Calendar Meetings

### Overview
Fetches user's calendar events for a specified date range.

### Trigger
**HTTP Request** (with Azure AD authentication)

**Method:** POST

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string"
    },
    "startDate": {
      "type": "string"
    },
    "endDate": {
      "type": "string"
    }
  }
}
```

### Actions

**1. Parse JSON**
- **Input:** `@{triggerBody()}`
- **Schema:** (use request body schema above)

**2. Office 365 Outlook - Get calendar view of events (V3)**
- **Calendar:** `Calendar` (user's default calendar)
- **Start Time:** `@{body('Parse_JSON')?['startDate']}`
- **End Time:** `@{body('Parse_JSON')?['endDate']}`
- **Query Parameters:**
  - `$select`: `subject,start,end,organizer,attendees,onlineMeeting,isOrganizer`
  - `$top`: `50`
  - `$orderby`: `start/dateTime`

**3. Filter Array (Teams meetings only)**
- **From:** `@{body('Get_calendar_view_of_events_(V3)')?['value']}`
- **Condition:** `@not(equals(item()?['onlineMeeting'], null))`

**4. Select (Transform data)**
- **From:** `@{body('Filter_array')}`
- **Map:**
  ```json
  {
    "id": "@{items('Apply_to_each')?['id']}",
    "subject": "@{items('Apply_to_each')?['subject']}",
    "start": "@{items('Apply_to_each')?['start']?['dateTime']}",
    "end": "@{items('Apply_to_each')?['end']?['dateTime']}",
    "organizer": "@{items('Apply_to_each')?['organizer']?['emailAddress']?['address']}",
    "attendees": "@{join(items('Apply_to_each')?['attendees'], ',')}",
    "isOrganizer": "@{items('Apply_to_each')?['isOrganizer']}",
    "transcriptAvailable": false
  }
  ```

**5. Response**
- **Status Code:** `200`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body:**
  ```json
  {
    "meetings": @{body('Select')},
    "source": "powerautomate"
  }
  ```

### Security Settings
- **Who can run this flow:** Specific users (Momo-Users security group) OR Anyone in organization
- **Authentication:** Azure AD (require Bearer token)

---

## Flow 2: Get Meeting Details with Transcript

### Overview
Fetches detailed meeting information and attempts to retrieve transcript using multiple strategies.

### Trigger
**HTTP Request** (with Azure AD authentication)

**Method:** POST

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string"
    },
    "meetingId": {
      "type": "string"
    }
  }
}
```

### Actions

**1. Parse JSON**
- **Input:** `@{triggerBody()}`

**2. Office 365 Outlook - Get event (V4)**
- **Event Id:** `@{body('Parse_JSON')?['meetingId']}`
- **Query Parameters:**
  - `$select`: `subject,start,end,organizer,attendees,body,location,onlineMeeting`

**3. Initialize variable: transcriptContent**
- **Name:** `transcriptContent`
- **Type:** `String`
- **Value:** `null`

**4. Initialize variable: transcriptAvailable**
- **Name:** `transcriptAvailable`
- **Type:** `Boolean`
- **Value:** `false`

**5. Try Scope: Get Transcript via Graph API**

**5.1. HTTP with Azure AD**
- **Method:** `GET`
- **URI:** `https://graph.microsoft.com/v1.0/me/onlineMeetings/@{body('Get_event_(V4)')?['onlineMeeting']?['onlineMeetingId']}/transcripts`
- **Audience:** `https://graph.microsoft.com`

**5.2. Condition: Check if transcripts exist**
- **If:** `@greater(length(body('HTTP_with_Azure_AD')?['value']), 0)`

**5.2.1. HTTP with Azure AD - Get Transcript Content**
- **Method:** `GET`
- **URI:** `https://graph.microsoft.com/v1.0/me/onlineMeetings/@{body('Get_event_(V4)')?['onlineMeeting']?['onlineMeetingId']}/transcripts/@{first(body('HTTP_with_Azure_AD')?['value'])?['id']}/content`
- **Audience:** `https://graph.microsoft.com`

**5.2.2. Set variable: transcriptContent**
- **Value:** `@{body('HTTP_with_Azure_AD_-_Get_Transcript_Content')}`

**5.2.3. Set variable: transcriptAvailable**
- **Value:** `true`

**6. Catch Scope: Fallback to OneDrive**

**Configure run after:** Run if "Try Scope" fails

**6.1. OneDrive for Business - List files in folder**
- **Folder:** `/Recordings` (or `/Microsoft Teams Chat Files`)
- **Query:** (none - we'll filter manually)

**6.2. Filter Array (Search for transcript)**
- **From:** `@{body('List_files_in_folder')?['value']}`
- **Condition:**
  - Contains: `@{toLower(item()?['name'])}` contains `transcript`
  - AND Contains: `@{toLower(item()?['name'])}` contains `@{toLower(body('Get_event_(V4)')?['subject'])}`

**6.3. Condition: Check if transcript file found**
- **If:** `@greater(length(body('Filter_Array_-_Search_for_transcript')), 0)`

**6.3.1. OneDrive for Business - Get file content**
- **File:** `@{first(body('Filter_Array_-_Search_for_transcript'))?['id']}`

**6.3.2. Set variable: transcriptContent**
- **Value:** `@{body('Get_file_content')}`

**6.3.3. Set variable: transcriptAvailable**
- **Value:** `true`

**7. Compose: Build Attendees Array**
- **Inputs:**
  ```json
  @{
    select(
      body('Get_event_(V4)')?['attendees'],
      {
        "name": item()?['emailAddress']?['name'],
        "email": item()?['emailAddress']?['address'],
        "type": toLower(item()?['type'])
      }
    )
  }
  ```

**8. Response**
- **Status Code:** `200`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body:**
  ```json
  {
    "meeting": {
      "id": "@{body('Get_event_(V4)')?['id']}",
      "title": "@{body('Get_event_(V4)')?['subject']}",
      "startDateTime": "@{body('Get_event_(V4)')?['start']?['dateTime']}",
      "endDateTime": "@{body('Get_event_(V4)')?['end']?['dateTime']}",
      "organizer": {
        "name": "@{body('Get_event_(V4)')?['organizer']?['emailAddress']?['name']}",
        "email": "@{body('Get_event_(V4)')?['organizer']?['emailAddress']?['address']}"
      },
      "attendees": @{outputs('Compose_-_Build_Attendees_Array')},
      "agenda": "@{body('Get_event_(V4)')?['body']?['content']}",
      "location": "@{body('Get_event_(V4)')?['location']?['displayName']}"
    },
    "transcript": {
      "available": @{variables('transcriptAvailable')},
      "content": "@{if(equals(variables('transcriptAvailable'), true), variables('transcriptContent'), null)}",
      "source": "@{if(equals(variables('transcriptAvailable'), true), 'flow', null)}"
    }
  }
  ```

### Security Settings
- **Who can run this flow:** Specific users (Momo-Users security group) OR Anyone in organization
- **Authentication:** Azure AD (require Bearer token)
- **Run-only users:** Provided by run-only user (uses caller's permissions)

---

## Flow 3 (Optional): Check Transcript Availability (Batch)

### Overview
Quick check if transcripts exist for multiple meetings without fetching full content. Used for showing transcript badges in meeting list.

### Trigger
**HTTP Request** (with Azure AD authentication)

**Method:** POST

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string"
    },
    "meetingIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

### Actions

**1. Parse JSON**
- **Input:** `@{triggerBody()}`

**2. Initialize variable: results**
- **Name:** `results`
- **Type:** `Array`
- **Value:** `[]`

**3. Apply to each: meetingId**
- **Select output from:** `@{body('Parse_JSON')?['meetingIds']}`

**3.1. Try Scope**

**3.1.1. HTTP with Azure AD - Check Transcripts**
- **Method:** `GET`
- **URI:** `https://graph.microsoft.com/v1.0/me/onlineMeetings/@{items('Apply_to_each')}/transcripts`
- **Audience:** `https://graph.microsoft.com`

**3.1.2. Append to array variable: results**
- **Value:**
  ```json
  {
    "meetingId": "@{items('Apply_to_each')}",
    "available": @{greater(length(body('HTTP_with_Azure_AD_-_Check_Transcripts')?['value']), 0)}
  }
  ```

**3.2. Catch Scope**

**3.2.1. Append to array variable: results**
- **Value:**
  ```json
  {
    "meetingId": "@{items('Apply_to_each')}",
    "available": false
  }
  ```

**4. Response**
- **Status Code:** `200`
- **Body:**
  ```json
  {
    "results": @{variables('results')}
  }
  ```

---

## Deployment Instructions

### Prerequisites
1. Power Automate license (included with M365 standard)
2. Office 365 Outlook connector enabled
3. OneDrive for Business connector enabled
4. Azure AD authentication configured

### Steps

**1. Import Flows**
- In Power Automate portal, click "My flows" → "Import" → "Import Package (Legacy)"
- Upload flow definition (if exported as ZIP)
- OR manually create flows following structure above

**2. Configure Connections**
- Each flow requires Office 365 Outlook connection
- Each flow requires OneDrive for Business connection (Flow 2 only)
- Users must authenticate their own accounts (delegated permissions)

**3. Configure Trigger Authentication**
- In HTTP trigger settings:
  - Select "Azure AD" authentication
  - Set "Who can trigger" to appropriate security group
  - Save trigger URL (needed for app configuration)

**4. Test Flows**
- Use Power Automate "Test" feature
- Provide sample JSON inputs
- Verify responses match expected schema

**5. Update App Configuration**
```typescript
// In PowerAutomateService.ts
private flowUrls = {
  getCalendar: 'https://prod-xx.westeurope.logic.azure.com:443/workflows/[FLOW_1_ID]/triggers/manual/invoke',
  getMeetingDetails: 'https://prod-xx.westeurope.logic.azure.com:443/workflows/[FLOW_2_ID]/triggers/manual/invoke',
  checkTranscripts: 'https://prod-xx.westeurope.logic.azure.com:443/workflows/[FLOW_3_ID]/triggers/manual/invoke'
};
```

---

## Testing Checklist

### Flow 1: Get Calendar Meetings

**Test Case 1: Valid date range**
```json
POST https://[flow1-url]
Authorization: Bearer [user-token]

{
  "action": "getCalendar",
  "startDate": "2025-10-20T00:00:00Z",
  "endDate": "2025-10-27T23:59:59Z"
}
```

**Expected Response:**
```json
{
  "meetings": [
    {
      "id": "AAMkAGZm...",
      "subject": "Weekly Standup",
      "start": "2025-10-21T10:00:00Z",
      "end": "2025-10-21T10:30:00Z",
      "organizer": "john@momentum.com",
      "attendees": "jane@momentum.com,bob@momentum.com",
      "isOrganizer": false,
      "transcriptAvailable": false
    }
  ],
  "source": "powerautomate"
}
```

**Test Case 2: No meetings in range**
- Should return empty array: `{"meetings": [], "source": "powerautomate"}`

**Test Case 3: Invalid token**
- Should return 401 Unauthorized

---

### Flow 2: Get Meeting Details with Transcript

**Test Case 1: Meeting with transcript**
```json
POST https://[flow2-url]
Authorization: Bearer [user-token]

{
  "action": "getMeetingDetails",
  "meetingId": "AAMkAGZm..."
}
```

**Expected Response:**
```json
{
  "meeting": {
    "id": "AAMkAGZm...",
    "title": "Weekly Standup",
    "startDateTime": "2025-10-21T10:00:00Z",
    "endDateTime": "2025-10-21T10:30:00Z",
    "organizer": {
      "name": "John Smith",
      "email": "john@momentum.com"
    },
    "attendees": [
      {
        "name": "Jane Doe",
        "email": "jane@momentum.com",
        "type": "required"
      }
    ],
    "agenda": "1. Progress\n2. Blockers",
    "location": "Teams Meeting"
  },
  "transcript": {
    "available": true,
    "content": "[Transcript content...]",
    "source": "flow"
  }
}
```

**Test Case 2: Meeting without transcript**
- `transcript.available` should be `false`
- `transcript.content` should be `null`

**Test Case 3: Invalid meeting ID**
- Should return 404 or handle gracefully

---

## Monitoring & Debugging

### View Flow Runs
1. Go to Power Automate portal
2. Click "My flows" → [Flow Name] → "Run history"
3. Click on specific run to see detailed logs
4. Check each action's inputs/outputs

### Common Issues

**Issue 1: "Unauthorized" errors**
- **Cause:** User hasn't connected their Office 365 account
- **Solution:** User must visit Power Automate portal and authenticate connection

**Issue 2: Transcript not found via OneDrive**
- **Cause:** Auto-save to OneDrive not enabled OR file naming mismatch
- **Solution:** Check Teams admin settings; adjust file search logic

**Issue 3: Flow timeout**
- **Cause:** Processing too many meetings or large transcript files
- **Solution:** Add pagination; reduce batch size

**Issue 4: "Forbidden" when calling Graph API from flow**
- **Cause:** User's account lacks permission even in delegated context
- **Solution:** May still require IT to enable delegated permissions

---

## Cost Analysis (FREE Tier Limits)

**Per User (M365 Standard License):**
- 2,000 API requests/day
- Each flow run = 1 request

**Typical Usage:**
- Calendar load: 1 request
- Meeting details: 1 request per meeting selected
- Average user: 20-30 requests/day
- **Conclusion:** FREE tier is sufficient for 99% of users

**Enterprise Tier (if needed):**
- Unlimited runs
- Cost: ~$15/user/month (Power Automate Per User Plan)
- Only needed if users generate >2,000 notes/day (unrealistic)

---

## Fallback Strategy Matrix

| Scenario | Primary | Fallback 1 | Fallback 2 | Final Fallback |
|----------|---------|------------|------------|----------------|
| **Calendar Access** | Graph API | Power Automate Flow 1 | - | Manual paste (Tab 2) |
| **Meeting Details** | Graph API | Power Automate Flow 2 | - | Manual paste (Tab 2) |
| **Transcript (Graph)** | `/onlineMeetings/.../transcripts` | Power Automate HTTP → Graph | OneDrive search | Manual paste |
| **Transcript (OneDrive)** | Graph API `/drive/...` | Power Automate OneDrive connector | - | Manual paste |

**Goal:** Always provide a working path, even if degraded UX.

---

## Security Considerations

### Data Flow
```
User's Browser
  ↓ (HTTPS, Bearer token)
Power Automate Flow (Azure)
  ↓ (Uses user's delegated permissions)
Microsoft 365 APIs
  ↓ (Returns user's own data only)
Power Automate Flow
  ↓ (HTTPS response)
User's Browser
```

### What IT Should Know
1. **No elevated service account** - Flows run in user context
2. **No data persistence** - Transcripts processed in-memory, not stored by flows
3. **Audit trail** - All flow runs logged in Azure AD and Power Automate
4. **Same permissions as Graph API** - Flows use identical underlying APIs
5. **Revocable** - Users can disconnect Office 365 connection anytime

### What Users Should Know
1. **First-time setup** - Must authenticate Office 365 connection (one-time)
2. **Data access** - Flows can only access your own calendar/meetings (not others')
3. **Revoke access** - Can disconnect in Power Automate portal anytime

---

## Next Steps

1. ✅ Review flow structures above
2. ✅ Deploy Flow 1 (Get Calendar) to Power Automate
3. ✅ Deploy Flow 2 (Get Meeting Details with Transcript)
4. ✅ Test with your Microsoft 365 account
5. ✅ Document transcript endpoint behavior in YOUR tenant
6. ✅ Update app configuration with flow URLs
7. ✅ Implement PowerAutomateService in app
8. ✅ Test end-to-end fallback (disable Graph API permissions temporarily)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-27
