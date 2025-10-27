# Momo Meeting Notes - Implementation Roadmap

**Based on:** IPG Tenant Test Results (2025-10-27)
**Strategy:** OneDrive Search (Strategy 2)
**Status:** Ready to Implement

---

## Executive Summary

Testing confirmed that **Strategy 2 (OneDrive Search)** works in the IPG tenant without requiring admin consent. This document outlines the implementation plan.

### Key Decisions
- ✅ **Primary:** OneDrive /Recordings folder
- ✅ **Fallback 1:** Teams Chat Files folder
- ✅ **Fallback 2:** Manual paste (existing functionality)
- ❌ **NOT USING:** OnlineMeetings transcript API (blocked by admin consent)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  USER INTERFACE (React)                      │
│                                                              │
│  ┌────────────────────┐    ┌──────────────────────┐        │
│  │ Tab 1:             │    │ Tab 2:               │        │
│  │ Select Meeting     │    │ Paste Transcript     │        │
│  │                    │    │ (Manual Fallback)    │        │
│  │ 1. Calendar Picker │    │                      │        │
│  │ 2. Meeting List    │    │ Existing workflow    │        │
│  │ 3. Auto-populate   │    │                      │        │
│  └──────────┬─────────┘    └──────────────────────┘        │
│             │                                                │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│               SERVICE LAYER (TypeScript)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           MeetingService (Orchestrator)                │ │
│  │  • getCalendarMeetings(start, end)                     │ │
│  │  • getMeetingWithTranscript(meetingId)                 │ │
│  │  • searchTranscriptInOneDrive(meetingSubject, date)    │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              GraphService                              │ │
│  │  • getCalendarView(start, end)                         │ │
│  │  • getMeetingDetails(id)                               │ │
│  │  • searchOneDrive(path, filter)                        │ │
│  │  • downloadFile(fileId)                                │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          TranscriptParser                              │ │
│  │  • parseVTT(content)                                   │ │
│  │  • formatForAI(parsed)                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│              Microsoft Graph API                             │
│                                                              │
│  • /me/calendar/calendarView                                 │
│  • /me/events/{id}                                           │
│  • /me/drive/root:/Recordings:/children                      │
│  • /me/drive/items/{id}/content                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### **Phase 1: Authentication & Setup** (Days 1-3)

#### Tasks:
1. **Configure Azure AD App (Production)**
   - Create new app registration for production
   - Add redirect URIs for production domain
   - Configure permissions:
     - `User.Read`
     - `Calendars.Read`
     - `OnlineMeetings.Read`
     - `Files.Read`

2. **Implement AuthService**
   ```typescript
   // services/authService.ts
   export class AuthService {
     private msalInstance: PublicClientApplication;
     private tokenExpiryTime: number | null = null;

     async login(): Promise<string> { ... }
     async getAccessToken(): Promise<string> { ... }
     async refreshToken(): Promise<void> { ... }
     isTokenValid(): boolean { ... }
   }
   ```

3. **Add MSAL to project**
   ```bash
   npm install @azure/msal-browser @azure/msal-react
   npm install @microsoft/microsoft-graph-client
   ```

4. **Create auth configuration**
   ```typescript
   // config/authConfig.ts
   export const msalConfig = {
     auth: {
       clientId: process.env.REACT_APP_CLIENT_ID,
       authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
       redirectUri: window.location.origin
     },
     cache: {
       cacheLocation: 'sessionStorage',
       storeAuthStateInCookie: false
     }
   };
   ```

**Deliverables:**
- ✅ AuthService implemented
- ✅ User can log in with Microsoft account
- ✅ Access token acquired and refreshed automatically

---

### **Phase 2: Calendar Integration** (Days 4-7)

#### Tasks:
1. **Create GraphService**
   ```typescript
   // services/graphService.ts
   export class GraphService {
     private client: Client;

     async getCalendarView(start: string, end: string): Promise<Meeting[]> {
       const response = await this.client
         .api('/me/calendar/calendarView')
         .query({
           startDateTime: start,
           endDateTime: end,
           $select: 'subject,start,end,organizer,attendees,onlineMeeting',
           $orderby: 'start/dateTime',
           $top: 50
         })
         .get();

       return response.value
         .filter(e => e.onlineMeeting) // Teams meetings only
         .map(this.mapToMeeting);
     }

     async getMeetingDetails(id: string): Promise<MeetingDetails> { ... }
   }
   ```

2. **Build Calendar UI Components**
   - `CalendarPicker.tsx` - Date selector
   - `MeetingList.tsx` - List of meetings
   - `MeetingCard.tsx` - Individual meeting card with badge

3. **Add Transcript Availability Badge**
   ```typescript
   // Check if transcript likely exists (optimistic)
   const hasTranscript = meeting.start < new Date(); // Past meeting
   ```

**Deliverables:**
- ✅ User can select date
- ✅ User sees list of meetings
- ✅ Meetings show organizer, time, subject
- ✅ Badge indicates if transcript may be available

---

### **Phase 3: Transcript Retrieval** (Days 8-12)

#### Tasks:
1. **Implement OneDrive Search**
   ```typescript
   // services/transcriptService.ts
   export class TranscriptService {
     async searchTranscript(
       meetingSubject: string,
       meetingDate: Date
     ): Promise<string | null> {
       // Strategy 1: Search in /Recordings
       let transcript = await this.searchInFolder(
         '/Recordings',
         meetingSubject,
         meetingDate
       );

       if (!transcript) {
         // Strategy 2: Search in /Microsoft Teams Chat Files
         transcript = await this.searchInFolder(
           '/Microsoft Teams Chat Files',
           meetingSubject,
           meetingDate
         );
       }

       return transcript;
     }

     private async searchInFolder(
       folder: string,
       subject: string,
       date: Date
     ): Promise<string | null> {
       // List files in folder
       const files = await this.graphService.listFiles(folder);

       // Find matching file
       const match = this.findMatchingFile(files, subject, date);

       if (match) {
         // Download file content
         const content = await this.graphService.downloadFile(match.id);
         // Parse VTT format
         return this.parseVTT(content);
       }

       return null;
     }
   }
   ```

2. **File Name Matching Algorithm**
   ```typescript
   private findMatchingFile(
     files: DriveItem[],
     subject: string,
     date: Date
   ): DriveItem | null {
     const normalized = subject
       .toLowerCase()
       .replace(/[^a-z0-9]/g, '');

     const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
     // YYYYMMDD format

     return files.find(file => {
       const fileName = file.name.toLowerCase();
       return (
         fileName.includes(normalized) &&
         fileName.includes(dateStr) &&
         fileName.endsWith('.vtt')
       );
     });
   }
   ```

3. **VTT Parser**
   ```typescript
   private parseVTT(content: string): string {
     const lines = content.split('\n');
     const transcript: Array<{ speaker: string; text: string }> = [];

     for (const line of lines) {
       const match = line.match(/<v ([^>]+)>(.+)/);
       if (match) {
         transcript.push({
           speaker: match[1].trim(),
           text: match[2].trim()
         });
       }
     }

     // Format for AI agent
     return transcript
       .map(t => `${t.speaker}: ${t.text}`)
       .join('\n');
   }
   ```

4. **Auto-populate Form**
   ```typescript
   async function handleMeetingSelect(meetingId: string) {
     setLoading(true);

     try {
       // Get meeting details
       const meeting = await graphService.getMeetingDetails(meetingId);

       // Auto-populate basic fields
       setMeetingTitle(meeting.subject);
       setAgenda(extractAgenda(meeting.body));
       setParticipants(meeting.attendees);

       // Try to fetch transcript
       const transcript = await transcriptService.searchTranscript(
         meeting.subject,
         meeting.start
       );

       if (transcript) {
         setTranscript(transcript);
         toast.success('Transcript loaded successfully!');
       } else {
         toast.warning('Transcript not found. Please paste manually.');
       }
     } catch (error) {
       toast.error('Failed to load meeting details');
     } finally {
       setLoading(false);
     }
   }
   ```

**Deliverables:**
- ✅ Transcript auto-fetched from OneDrive
- ✅ VTT format parsed correctly
- ✅ Form auto-populated with all fields
- ✅ Graceful fallback to manual paste if transcript not found

---

### **Phase 4: UI/UX Refinement** (Days 13-15)

#### Tasks:
1. **Add Loading States**
   - Skeleton loaders for calendar
   - Spinner while fetching transcript
   - Progress indicator

2. **Error Handling UI**
   - Toast notifications for errors
   - Clear error messages
   - Retry buttons

3. **Two-Tab Interface**
   ```tsx
   <Tabs defaultValue="select-meeting">
     <TabsList>
       <TabsTrigger value="select-meeting">
         Select Meeting
       </TabsTrigger>
       <TabsTrigger value="paste-transcript">
         Paste Transcript
       </TabsTrigger>
     </TabsList>

     <TabsContent value="select-meeting">
       <CalendarPicker />
       <MeetingList />
     </TabsContent>

     <TabsContent value="paste-transcript">
       <ManualInputForm />
     </TabsContent>
   </Tabs>
   ```

4. **Cache Management**
   - Cache calendar data (15 min TTL)
   - Invalidate on visibility change
   - Clear on logout

**Deliverables:**
- ✅ Polished UI with smooth transitions
- ✅ Clear error messages
- ✅ Loading states for all async operations
- ✅ Two-tab interface working seamlessly

---

### **Phase 5: Testing & Edge Cases** (Days 16-18)

#### Test Scenarios:
1. **Happy Path**
   - User selects meeting with transcript
   - All fields auto-populate
   - Notes generated successfully

2. **Transcript Not Found**
   - User selects old meeting (no transcript)
   - Clear message shown
   - User can switch to manual paste

3. **Transcript Still Processing**
   - User selects recent meeting (<10 min ago)
   - Show "Processing..." message
   - Suggest retry in a few minutes

4. **File Name Mismatch**
   - Meeting subject has special characters
   - Fuzzy matching still works
   - Or fallback to manual

5. **Token Expiry**
   - User leaves tab open for hours
   - Token refresh kicks in
   - Seamless re-authentication

6. **Network Errors**
   - API timeout
   - Retry logic works
   - Fallback to manual if all retries fail

**Deliverables:**
- ✅ All edge cases handled
- ✅ Comprehensive error handling
- ✅ Retry logic tested
- ✅ Fallbacks working

---

### **Phase 6: Documentation & Deployment** (Days 19-20)

#### Tasks:
1. **User Documentation**
   - How to log in
   - How to select meeting
   - What to do if transcript not found

2. **Admin Documentation**
   - Azure AD app setup
   - Environment variables
   - Deployment instructions

3. **Code Documentation**
   - JSDoc comments for all services
   - README updates
   - Architecture diagrams

4. **Deployment**
   - Deploy to staging
   - User acceptance testing
   - Deploy to production

**Deliverables:**
- ✅ Complete documentation
- ✅ Deployed to production
- ✅ User training complete

---

## Technical Specifications

### API Endpoints Used

| Endpoint | Purpose | Permission |
|----------|---------|------------|
| `GET /me` | User profile | `User.Read` |
| `GET /me/calendar/calendarView` | List meetings | `Calendars.Read` |
| `GET /me/events/{id}` | Meeting details | `Calendars.Read` |
| `GET /me/drive/root:/{path}:/children` | List files | `Files.Read` |
| `GET /me/drive/items/{id}/content` | Download file | `Files.Read` |

### Data Models

```typescript
interface Meeting {
  id: string;
  subject: string;
  start: Date;
  end: Date;
  organizer: string;
  attendees: Attendee[];
  hasTranscript?: boolean;
}

interface MeetingDetails extends Meeting {
  agenda: string;
  location: string;
  body: string;
}

interface Attendee {
  name: string;
  email: string;
  type: 'required' | 'optional' | 'organizer';
}

interface TranscriptSearchResult {
  found: boolean;
  content?: string;
  source?: 'recordings' | 'teams-files';
  error?: string;
}
```

### Environment Variables

```env
# Azure AD Configuration
REACT_APP_CLIENT_ID=52f33915-e345-4af8-afc4-fa16dde29755
REACT_APP_TENANT_ID=d026e4c1-5892-497a-b9da-ee493c9f0364
REACT_APP_REDIRECT_URI=https://yourdomain.com

# Feature Flags
REACT_APP_ENABLE_CALENDAR_INTEGRATION=true
REACT_APP_ENABLE_TRANSCRIPT_SEARCH=true
REACT_APP_CACHE_TTL_MINUTES=15
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Calendar load (cached) | < 500ms | Instant if cached |
| Calendar load (fresh) | < 3s | Graph API call |
| Meeting details fetch | < 2s | Single API call |
| Transcript search | < 5s | May need to search 2 folders |
| Transcript download | < 3s | Depends on file size |
| **Total (happy path)** | < 10s | Calendar → Select → Auto-populate |

---

## Risk Mitigation

### Risk: File Name Matching Fails
**Mitigation:**
- Use multiple normalization strategies
- Try fuzzy matching (Levenshtein distance)
- Search by date first, then filter by subject
- Always offer manual paste fallback

### Risk: VTT Format Varies
**Mitigation:**
- Handle multiple VTT format variants
- Extract text even if speaker tags missing
- Fallback to raw text if parsing fails

### Risk: Transcript Delay
**Mitigation:**
- Show clear message: "Transcript processing..."
- Estimate completion time (5-10 min after meeting)
- Allow easy retry later

### Risk: Token Expiry During Session
**Mitigation:**
- Auto-refresh token every 55 minutes
- Handle `InteractionRequiredAuthError` gracefully
- Re-authenticate silently if possible

---

## Success Metrics

### User Experience Metrics
- ⏱️ **Time to generate notes:** Reduce from 2-3 minutes to 10-15 seconds
- 📉 **Manual paste rate:** < 20% (80% should auto-fetch)
- ✅ **Success rate:** > 90% for meetings with transcripts
- 😊 **User satisfaction:** Track via feedback

### Technical Metrics
- 🚀 **API response time:** < 3s (p95)
- 💪 **Uptime:** > 99.5%
- 🔄 **Token refresh success:** > 99%
- 📊 **Cache hit rate:** > 70%

---

## Rollout Plan

### Week 1: Alpha Testing
- Deploy to 5-10 beta users
- Gather feedback
- Fix critical bugs

### Week 2: Beta Testing
- Deploy to 50 users
- Monitor error rates
- Optimize performance

### Week 3: Gradual Rollout
- 25% of users
- Monitor metrics
- Address issues

### Week 4: Full Rollout
- 100% of users
- Announce new feature
- Provide training materials

---

## Support & Maintenance

### Monitoring
- API error rates
- Token refresh failures
- Transcript search success rate
- User-reported issues

### Regular Tasks
- Review error logs weekly
- Update VTT parser if format changes
- Monitor Microsoft Graph API changes
- Refresh access tokens before expiry

### Escalation Path
1. App error → Check logs
2. API 403/401 → Check token/permissions
3. Transcript not found → Check Teams admin settings
4. Format parsing fails → Update parser logic

---

## Future Enhancements

### v2.0 (Q2 2025)
- **Smart caching:** Pre-fetch transcripts for upcoming meetings
- **Batch processing:** Generate notes for multiple meetings at once
- **Search history:** Search through past meetings
- **Favorites:** Star frequently accessed meetings

### v2.1 (Q3 2025)
- **Teams bot integration:** Generate notes directly in Teams chat
- **Scheduled generation:** Auto-generate notes 1 hour after meeting
- **Email summaries:** Send notes via email to attendees

### v3.0 (Q4 2025)
- **Real-time transcript:** Process live transcription during meeting
- **Action item tracking:** Track completion of action items
- **Meeting analytics:** Insights on meeting patterns

---

## Conclusion

**Status:** ✅ **READY TO IMPLEMENT**

All technical requirements validated through testing. Strategy 2 (OneDrive Search) provides robust transcript retrieval without admin consent blockers.

**Next Action:** Begin Phase 1 (Authentication & Setup)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-27
**Owner:** Luis Bustos
**Status:** Approved for Implementation
