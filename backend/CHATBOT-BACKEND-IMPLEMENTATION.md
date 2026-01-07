# Momentum Knowledge Base Chatbot - Backend Implementation

**Date**: 2026-01-07
**Status**: Phase 1 Complete - Backend Infrastructure ✅

---

## Overview

This document describes the backend infrastructure implemented for the Momentum Knowledge Base Chatbot. The backend provides secure proxy endpoints for communicating with Copilot Studio via Direct Line API and looking up personnel data from Power Automate flows.

---

## What Was Implemented

### 1. Copilot Studio Integration (Direct Line API)

Three new endpoints for communicating with Copilot Studio:

#### POST `/api/copilot/conversations`
- **Purpose**: Create a new Direct Line conversation with Copilot Studio
- **Authentication**: Requires valid Azure AD token with Momentum group membership
- **Returns**:
  - `conversationId` - Unique conversation identifier
  - `token` - Direct Line token for this conversation
  - `expires_in` - Token expiration time
  - `streamUrl` - Optional WebSocket URL for streaming

**Example Response**:
```json
{
  "conversationId": "abc123...",
  "token": "xyz789...",
  "expires_in": 3600,
  "streamUrl": "wss://..."
}
```

#### POST `/api/copilot/messages`
- **Purpose**: Send a message to Copilot Studio with department context
- **Authentication**: Requires valid Azure AD token with Momentum group membership
- **Request Body**:
  ```json
  {
    "conversationId": "abc123...",
    "text": "What is the PTO policy?",
    "departmentGroup": "Global Technology",
    "department": "Production: Global Technology",
    "role": "Senior XD Designer"
  }
  ```
- **Department Context Injection**: Automatically injects user's department, role, and email into `channelData.userContext` for use by Copilot Studio flows
- **Returns**: Activity ID confirming message was sent

**channelData Structure**:
```json
{
  "channelData": {
    "userContext": {
      "email": "user@momentumww.com",
      "name": "John Doe",
      "departmentGroup": "Global Technology",
      "department": "Production: Global Technology",
      "role": "Senior XD Designer",
      "timestamp": "2026-01-07T14:30:00Z"
    }
  }
}
```

#### GET `/api/copilot/activities/:conversationId?watermark=...`
- **Purpose**: Poll for bot responses from Copilot Studio
- **Authentication**: Requires valid Azure AD token with Momentum group membership
- **Query Parameters**:
  - `watermark` (optional) - Resume from a specific point in the conversation
- **Returns**:
  ```json
  {
    "activities": [
      {
        "type": "message",
        "id": "activity123",
        "timestamp": "2026-01-07T14:30:01Z",
        "from": {
          "id": "bot",
          "name": "Momentum KB Bot"
        },
        "text": "Our PTO policy allows...",
        "attachments": []
      }
    ],
    "watermark": "5"
  }
  ```
- **Frontend Usage**: Poll this endpoint every 1-2 seconds while waiting for bot responses

---

### 2. Personnel Lookup Endpoint

#### GET `/api/personnel/lookup?email=user@momentumww.com`
- **Purpose**: Look up personnel data by email address from Power Automate flow
- **Authentication**: Requires valid Azure AD token with Momentum group membership
- **Proxies to**: Power Automate flow that queries Momentum personnel database
- **Returns**:
  ```json
  {
    "success": true,
    "user": {
      "emailAddress": "user@momentumww.com",
      "name": "John Doe",
      "departmentGroup": "Global Technology",
      "department": "Production: Global Technology",
      "gradeGroup": "Grade 4",
      "roleWithoutNumbers": "Senior XD Designer"
    }
  }
  ```
- **Fallback**: If not configured, frontend can use `departmentMap` from `departmentService.ts` (24h cache)
- **Field Transformation**: Automatically converts Pascal Case fields from Power Automate to camelCase

**Power Automate Flow Requirements**:
- Trigger: HTTP Request (POST)
- Request body: `{ "action": "lookupByEmail", "email": "user@momentumww.com", "timestamp": "..." }`
- Response: `{ "success": true, "user": { ...MomentumUserData } }`

---

## Environment Variables

### New Variables Added to `backend/.env.example`

```env
# Copilot Studio Direct Line Secret (required for chatbot)
COPILOT_DIRECT_LINE_SECRET=YOUR_COPILOT_DIRECT_LINE_SECRET_HERE

# Power Automate flow for personnel lookup (optional)
PERSONNEL_LOOKUP_FLOW_URL=https://prod-XX.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...
```

### How to Get Copilot Direct Line Secret

1. Go to your Copilot Studio agent settings
2. Navigate to **"Channels"** → **"Direct Line"**
3. Copy one of the secret keys
4. Add to `.env` file or Cloud Run environment variables

**Documentation**: [Direct Line Authentication](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-authentication)

---

## Security Features

### 1. JWT Validation Middleware
- All endpoints protected with `validateAzureADToken` middleware
- Verifies JWT signature using Azure AD public keys
- Checks group membership (MOM WW All Users 1 SG)
- Extracts user context (email, name, oid, groups) from token

### 2. No Frontend Exposure
- `COPILOT_DIRECT_LINE_SECRET` never sent to frontend
- All Copilot Studio communication proxied through backend
- Personnel lookup credentials stay server-side

### 3. Graceful Degradation
- If `COPILOT_DIRECT_LINE_SECRET` not configured: Returns 503 with clear error message
- If `PERSONNEL_LOOKUP_FLOW_URL` not configured: Returns 503 with fallback instructions
- Frontend can handle these gracefully

---

## Error Handling

### Copilot Studio Errors

**503 Service Unavailable**:
```json
{
  "error": "service_unavailable",
  "error_description": "Copilot Studio integration not configured. Missing COPILOT_DIRECT_LINE_SECRET."
}
```

**400 Bad Request**:
```json
{
  "error": "invalid_request",
  "error_description": "Missing required fields: conversationId and text"
}
```

**500 Internal Error**:
```json
{
  "error": "internal_error",
  "error_description": "Failed to create Copilot conversation",
  "details": "Connection timeout"
}
```

### Personnel Lookup Errors

**404 Not Found**:
```json
{
  "error": "user_not_found",
  "error_description": "No personnel record found for email: user@momentumww.com"
}
```

**504 Gateway Timeout**:
```json
{
  "error": "timeout",
  "error_description": "Personnel lookup request timed out after 10 seconds"
}
```

---

## Logging

### Console Output Examples

**Conversation Created**:
```
[Copilot] Creating new conversation for user: user@momentumww.com
[Copilot] ✅ Conversation created: abc123...
```

**Message Sent**:
```
[Copilot] Sending message to conversation: abc123...
[Copilot] User context: {
  email: 'user@momentumww.com',
  departmentGroup: 'Global Technology',
  department: 'Production: Global Technology',
  role: 'Senior XD Designer'
}
[Copilot] ✅ Message sent successfully, activity ID: msg456...
```

**Activities Polled** (only logs when new activities exist):
```
[Copilot] ✅ Fetched 2 activities for conversation: abc123...
```

**Personnel Lookup**:
```
[Personnel] Looking up email: user@momentumww.com
[Personnel] ✅ User found: { name: 'John Doe', department: 'Global Technology' }
```

---

## Startup Output

When the backend server starts, you'll see:

```
==============================================================================
Note Crafter Backend API listening on port 8080
==============================================================================
API Base URL: https://interact.interpublic.com
Client ID configured: Yes
Client Secret configured: Yes
Azure AD Group Security: Enabled
Required Group: MOM WW All Users 1 SG (2c08b5d8-7def-4845-a48c-740b987dcffb)

Momentum Knowledge Base Chatbot:
  Copilot Direct Line: Configured ✅
  Personnel Lookup: Configured ✅
==============================================================================
```

If environment variables are missing:
```
Momentum Knowledge Base Chatbot:
  Copilot Direct Line: Not configured ⚠️
  Personnel Lookup: Not configured ⚠️
```

---

## Implementation Patterns

### Reused Existing Backend Patterns

1. **JWT Validation**: Uses `validateAzureADToken` middleware (same as existing endpoints)
2. **Error Handling**: Follows same error response format as existing API proxies
3. **CORS Configuration**: Uses existing CORS middleware
4. **Fetch Pattern**: Uses `node-fetch` like existing endpoints
5. **Field Transformation**: Uses same Pascal Case → camelCase pattern as `departmentService.ts`

### Key Design Decisions

1. **Department Context Injection**: Backend automatically injects user's department context into `channelData` so Copilot Studio flows can use it for filtering
2. **Polling vs WebSockets**: Frontend will use polling (GET `/api/copilot/activities`) for simplicity. WebSocket support available via `streamUrl` if needed later.
3. **Optional Personnel Lookup**: Personnel lookup is optional - frontend can fall back to `departmentMap` cache if not configured
4. **10-Second Timeout**: Personnel lookup has 10s timeout (same as `departmentService.ts` request timeout)

---

## Dependencies

### No New Dependencies Required

The backend already has all required dependencies:
- ✅ `express` - Web framework
- ✅ `cors` - CORS middleware
- ✅ `dotenv` - Environment variables
- ✅ `node-fetch` - HTTP client
- ✅ `jsonwebtoken` - JWT validation
- ✅ `jwks-rsa` - Azure AD key fetching

**Node Version**: 18.0.0+ (uses `AbortSignal.timeout` for request timeouts)

---

## Testing Checklist

### Manual Testing Steps

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Verify Startup Output**:
   - Check that Copilot Direct Line shows "Configured ✅"
   - Check that Personnel Lookup shows appropriate status

3. **Test Conversation Creation** (requires Azure AD token):
   ```bash
   curl -X POST http://localhost:8080/api/copilot/conversations \
     -H "Authorization: Bearer YOUR_AZURE_AD_TOKEN" \
     -H "Content-Type: application/json"
   ```
   - Should return `conversationId` and `token`

4. **Test Message Sending**:
   ```bash
   curl -X POST http://localhost:8080/api/copilot/messages \
     -H "Authorization: Bearer YOUR_AZURE_AD_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "conversationId": "...",
       "text": "What is the PTO policy?",
       "departmentGroup": "Global Technology",
       "department": "Production: Global Technology",
       "role": "Senior XD Designer"
     }'
   ```
   - Should return activity ID

5. **Test Activity Polling**:
   ```bash
   curl -X GET "http://localhost:8080/api/copilot/activities/CONVERSATION_ID?watermark=0" \
     -H "Authorization: Bearer YOUR_AZURE_AD_TOKEN"
   ```
   - Should return `activities` array and `watermark`

6. **Test Personnel Lookup**:
   ```bash
   curl -X GET "http://localhost:8080/api/personnel/lookup?email=user@momentumww.com" \
     -H "Authorization: Bearer YOUR_AZURE_AD_TOKEN"
   ```
   - Should return user data with `departmentGroup`, `department`, `role`

---

## Next Steps (Frontend Implementation - Not Part of This Task)

1. Create `services/copilotService.ts` with:
   - `createConversation()` - Calls POST `/api/copilot/conversations`
   - `sendMessage()` - Calls POST `/api/copilot/messages`
   - `pollActivities()` - Calls GET `/api/copilot/activities/:conversationId`

2. Create `services/personnelService.ts` with:
   - `lookupPersonnelByEmail()` - Calls GET `/api/personnel/lookup`

3. Create chatbot UI component that:
   - Uses `copilotService` to communicate with bot
   - Displays conversation history
   - Shows typing indicators while waiting for bot responses
   - Handles errors gracefully

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/server.js` | Added 3 Copilot endpoints + 1 personnel lookup endpoint (~300 lines) |
| `backend/.env.example` | Added `COPILOT_DIRECT_LINE_SECRET` and `PERSONNEL_LOOKUP_FLOW_URL` documentation |

**No new files created, no dependencies added.**

---

## References

- **Direct Line API Docs**: https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference
- **Copilot Studio Docs**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
- **Existing Backend Patterns**: See `backend/server.js` lines 45-120 (token and chat-ai endpoints)
- **Department Service Pattern**: See `services/departmentService.ts` for Power Automate flow integration example

---

## Benefits

✅ **Security**: All Copilot communication proxied through authenticated backend
✅ **Department Context**: Automatically inject user's department for personalized responses
✅ **Reusable Patterns**: Uses proven patterns from existing backend infrastructure
✅ **Graceful Degradation**: Clear error messages when services not configured
✅ **No Frontend Changes Needed**: Backend-only implementation
✅ **Production Ready**: JWT validation, error handling, logging all included

---

**Implementation Complete**: Backend infrastructure for Momentum Knowledge Base Chatbot is ready for frontend integration. 🚀
