# Momentum Department Data Integration - Implementation Summary

> **Status**: ✅ Complete and Ready to Use
> **Date**: 2025-10-30
> **Performance**: ~1.5 seconds to fetch 962 Momentum users on login

---

## 🎯 What Was Implemented

A complete integration that enriches meeting attendee data with accurate department information from the Momentum employee database, with automatic fallback to Azure AD Graph API for users not in the database or with null values.

---

## 📊 Data Flow

```
User Login
  ↓
AuthGuard fetches Graph API profile
  ↓
AuthGuard fetches Momentum department data (Power Automate → SQL)
  ↓
Stores 962 users in DepartmentContext (Map for O(1) lookup)
  ↓
Available throughout app session
  ↓
User generates meeting notes
  ↓
App.tsx enriches participants with Momentum data
  ↓
Enriched participants sent to AI agent
  ↓
Agent receives accurate department info for all attendees
```

---

## 🔑 Key Features

### 1. Automatic Null Handling ✅

**Priority Order** (exactly as requested):
1. **Momentum DepartmentGroup** (e.g., "Experience Production (XP)")
2. **Momentum Department** (if DepartmentGroup is null)
3. **Graph API department** (if both Momentum fields are null)
4. **"Unknown"** (if all sources are null)

### 2. Global Availability ✅

Department data is fetched once at login and available throughout the session via React Context:

```typescript
import { useDepartmentContext } from './contexts/DepartmentContext';

const { departmentMap } = useDepartmentContext();
const userData = departmentMap?.get('user@momentum.com');
```

### 3. Participant Enrichment ✅

Meeting attendees are automatically enriched before being sent to the AI agent:

**Before** (Graph API only):
```json
{
  "displayName": "James Gavigan",
  "email": "james.gavigan@momentumww.com",
  "department": "Technology"  // From Azure AD
}
```

**After** (Momentum enriched):
```json
{
  "displayName": "James Gavigan",
  "email": "james.gavigan@momentumww.com",
  "department": "Experience Production (XP)"  // From Momentum DB
}
```

### 4. Special Cases Handled ✅

**Japan/Non-US Users with Null Data**:
```
Momentum DepartmentGroup: null
Momentum Department: null
Result: Falls back to Graph API → "Marketing"
```

**External Participants Not in Momentum**:
```
Email: client@external.com
Momentum: Not found
Result: Uses Graph API department or "Unknown"
```

---

## 📁 Files Created

### 1. [services/departmentService.ts](services/departmentService.ts)
- `fetchMomentumDepartments()` - Fetches all active users from Power Automate
- `lookupDepartmentByEmail()` - Single user lookup helper
- `getDepartmentDataStats()` - Statistics about loaded data
- **Timeout**: 10 seconds with graceful error handling

### 2. [contexts/DepartmentContext.tsx](contexts/DepartmentContext.tsx)
- `DepartmentProvider` - React Context provider (wraps app at root level)
- `useDepartmentContext()` - Hook to access department map
- `useDepartmentLookup(email)` - Convenience hook for single lookup
- Stores loading state, error state, and last fetch timestamp

### 3. [utils/departmentLookup.ts](utils/departmentLookup.ts)
- `enrichAttendeeData()` - Enrich single attendee with priority fallback logic
- `enrichMultipleAttendees()` - Batch enrichment helper
- `getPreferredDepartment()` - Get best department value for a user
- `isMomentumUser()` - Check if user exists in Momentum DB
- `filterMomentumUsers()` - Filter list to only Momentum employees
- `getDepartmentStats()` - Get department breakdown for meeting attendees

---

## 📝 Files Modified

### 1. [appConfig.ts](appConfig.ts:8-10)
Added Power Automate flow URL configuration:
```typescript
momentumDepartmentFlowUrl: "https://2e7cf80af71de950a36d4962c11a22.06.environment.api.powerplatform.com..."
```

### 2. [index.tsx](index.tsx:18-22)
Wrapped app with `DepartmentProvider` at root level:
```typescript
<DepartmentProvider>
  <AuthGuard>
    <App />
  </AuthGuard>
</DepartmentProvider>
```

### 3. [auth/AuthGuard.tsx](auth/AuthGuard.tsx:223-282)
Added department data fetch after Graph API profile load:
- Fetches Momentum data in parallel with app initialization
- Non-blocking: App continues even if fetch fails
- Includes telemetry tracking for monitoring

### 4. [App.tsx](app.tsx:240-258)
Added participant enrichment before sending to agent:
- Enriches all participants with Momentum data
- Maintains fallback to Graph API for null values
- Preserves all existing participant properties

### 5. [utils/telemetryService.ts](utils/telemetryService.ts:11-12)
Added new telemetry events:
- `departmentDataFetched` - Tracks successful fetch with stats
- `departmentDataFetchFailed` - Tracks failures with error details

---

## 🔧 Power Automate Flow Configuration

**Flow Name**: `momentum-department-lookup`

**Trigger**: HTTP POST (no authentication required)

**Actions**:
1. **Execute SQL Query** - Queries `vw_Personnel_MeetingNotes` view
2. **Response** - Returns JSON with success flag and user array

**Response Format**:
```json
{
  "success": true,
  "timestamp": "2025-10-30T17:06:20.576Z",
  "recordCount": 962,
  "users": [
    {
      "EmailAddress": "user@momentum.com",
      "Name": "John Doe",
      "DepartmentGroup": "Experience Production (XP)",
      "Department": "Production: XP",
      "GradeGroup": "XP - Directors",
      "RoleWithoutNumbers": "Production Director, VP"
    },
    ...
  ]
}
```

**Performance**: ~1.5 seconds for 962 active users

---

## 🧪 How to Test

### 1. Start the Application

```bash
npm run dev
```

### 2. Log In and Check Console

You should see:
```
[AuthGuard] Fetching Momentum department data...
[DepartmentService] Successfully fetched 962 Momentum users in 1500ms
[AuthGuard] Momentum department data loaded successfully
✅ Telemetry event sent successfully: departmentDataFetched
```

### 3. Generate Meeting Notes with Participants

1. Add participants to your meeting (via CSV, email list, or transcript extraction)
2. Click "Generate Notes"
3. Check network tab - payload should include enriched participants
4. Agent receives accurate department data

### 4. Test Null Handling

Add a participant with email not in Momentum DB:
- Should fall back to Graph API department
- Or show "Unknown" if Graph API also has no data

---

## 📊 Expected Behavior

### Scenario 1: US User with Full Momentum Data
```
Email: james.gavigan@momentumww.com
Momentum DepartmentGroup: "Experience Production (XP)"
Graph API: "Technology"

Result: ✅ "Experience Production (XP)" (Momentum data used)
```

### Scenario 2: Japan User with Null DepartmentGroup
```
Email: yuki.tanaka@momentumww.jp
Momentum DepartmentGroup: null
Momentum Department: "Operations"
Graph API: "Marketing"

Result: ✅ "Operations" (Momentum Department fallback)
```

### Scenario 3: User with All Null Momentum Fields
```
Email: external@client.com
Momentum DepartmentGroup: null
Momentum Department: null
Graph API: "Consulting"

Result: ✅ "Consulting" (Graph API fallback)
```

### Scenario 4: External User Not in Momentum
```
Email: partner@agency.com
Momentum: Not found
Graph API: null

Result: ✅ "Unknown" (last resort fallback)
```

---

## 🎯 Integration Points

### Where Department Data is Used

**Current Implementation**:
- ✅ Loaded on login and stored in context
- ✅ Enriches participants before sending to agent
- ✅ Falls back gracefully when data is null or unavailable

**Future Use Cases** (data is ready):
- Display department badges on participant cards
- Filter/group attendees by department
- Department-specific meeting insights
- Cross-department collaboration metrics
- Department representation analytics

### How to Use in Other Components

```typescript
import { useDepartmentContext } from './contexts/DepartmentContext';
import { getPreferredDepartment } from './utils/departmentLookup';

function MyComponent() {
  const { departmentMap } = useDepartmentContext();

  const userDept = getPreferredDepartment(
    'user@momentum.com',
    'Marketing',  // Graph API fallback
    departmentMap
  );

  return <div>Department: {userDept}</div>;
}
```

---

## ⚡ Performance Characteristics

- **Initial fetch time**: ~1.5 seconds (962 users)
- **Data size**: ~150KB uncompressed, ~30-50KB compressed
- **Memory usage**: ~1MB (negligible)
- **Lookup performance**: O(1) via Map
- **Timeout**: 10 seconds (configurable)
- **Refresh frequency**: Once per session (on login)

---

## 🛡️ Error Handling

### Graceful Degradation

The implementation never breaks the app:

1. **Power Automate unavailable** → Uses Graph API only
2. **Network timeout** → Logs warning, app continues
3. **Invalid response format** → Logs error, uses fallback
4. **User not in Momentum DB** → Uses Graph API department
5. **Null department fields** → Falls back to next priority level

All errors are:
- Logged to console for debugging
- Tracked via telemetry for monitoring
- Non-blocking (app always loads)

---

## 📈 Telemetry Events

### departmentDataFetched

Sent when department data is successfully loaded:

```json
{
  "eventType": "departmentDataFetched",
  "eventPayload": {
    "recordCount": 962,
    "usersWithDepartment": 945,
    "usersWithDepartmentGroup": 912,
    "usersWithRole": 890,
    "fetchDurationMs": 1500,
    "source": "momentum-database"
  }
}
```

### departmentDataFetchFailed

Sent when fetch fails:

```json
{
  "eventType": "departmentDataFetchFailed",
  "eventPayload": {
    "reason": "Timeout after 10000ms",
    "fetchDurationMs": 10015,
    "willUseFallback": true
  }
}
```

---

## 🔍 Troubleshooting

### Issue: Department data not loading

**Check**:
1. Power Automate flow URL is correct in [appConfig.ts](appConfig.ts:10)
2. Flow is enabled and not disabled/deleted
3. SQL view returns data: `SELECT * FROM vw_Personnel_MeetingNotes`
4. Response action has opening `{` (no spaces before it)

**Console Logs**:
```
[DepartmentService] Momentum department flow URL not configured
[DepartmentService] Power Automate request failed with status 504
```

### Issue: Participants show "Unknown" department

**Check**:
1. Participant email matches Momentum database (case-insensitive)
2. Momentum DepartmentGroup and Department fields are not both null
3. Graph API department field has a value
4. Browser console for enrichment warnings

**Debug**:
```typescript
const userData = departmentMap?.get('user@momentum.com');
console.log('Momentum data:', userData);
console.log('Graph dept:', participant.department);
```

### Issue: Slow performance on login

**Check**:
1. SQL view query performance in SSMS
2. Power Automate flow execution time in run history
3. Network latency (check browser network tab)

**Solutions**:
- Increase timeout in [departmentService.ts](services/departmentService.ts) to 60 seconds
- Optimize SQL view with indexes
- Consider caching table for faster queries

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Add DepartmentGroup to Payload Type

If you want to pass both `department` and `departmentGroup` to the agent:

```typescript
// In types.ts - Participant interface
export interface Participant {
  // ... existing fields
  department?: string;
  departmentGroup?: string;  // Add this
  role?: string;  // Momentum RoleWithoutNumbers
}
```

Then uncomment lines 255-256 in [App.tsx](App.tsx:255-256):

```typescript
departmentGroup: enrichedData.departmentGroup,
role: enrichedData.role || participant.jobTitle
```

### 2. Display Department Badges

Show Momentum department on participant cards:

```typescript
<ParticipantCard
  participant={participant}
  badge={participant.departmentGroup || participant.department}
  badgeColor="blue"
/>
```

### 3. Department Analytics

Track cross-department collaboration:

```typescript
import { getDepartmentStats } from './utils/departmentLookup';

const stats = getDepartmentStats(participantEmails, departmentMap);
console.log(`${stats.departmentBreakdown['Technology']} people from Technology`);
```

---

## 📚 Additional Resources

- **Power Automate Fix Guide**: [POWER-AUTOMATE-DEPARTMENT-FIX.md](POWER-AUTOMATE-DEPARTMENT-FIX.md)
- **Telemetry Documentation**: [Telemetry.md](Telemetry.md)
- **Participant System**: Participant extraction hooks in `hooks/useParticipantExtraction.ts`

---

## ✅ Verification Checklist

- [x] Power Automate flow returns 200 OK with 962 users
- [x] Response has correct JSON format (opening `{` present)
- [x] AuthGuard fetches department data on login
- [x] Data stored in DepartmentContext
- [x] Null handling works correctly (DepartmentGroup → Department → Graph → Unknown)
- [x] Participants enriched before sending to agent
- [x] Telemetry events tracked
- [x] App continues to work if Power Automate fails
- [x] No React context errors on login
- [x] Browser console shows successful fetch logs

---

**Implementation completed on**: 2025-10-30
**Last updated**: 2025-10-30
**Status**: Production Ready ✅
