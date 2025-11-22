# Backend API Integration Guide

This guide explains how the Employee Onboarding System integrates with the backend API, how to enable/disable API mode, and how to test the complete system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Context API Integration](#context-api-integration)
3. [Enabling/Disabling API Mode](#enablingdisabling-api-mode)
4. [Backend Setup](#backend-setup)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Two-Mode System

The application supports **two data modes**:

1. **Mock Data Mode** (Default Fallback)
   - Uses static data from `utils/mockData.ts`
   - No backend required
   - Perfect for development and UI testing
   - Automatic fallback when API unavailable

2. **API Mode** (Production)
   - Connects to backend REST API
   - Data persisted to JSON files (backend/database/data/)
   - Full CRUD operations
   - Automatic fallback to mock data on error

### Data Flow

```
Frontend Context → API Service → Backend API → JSON File Database
       ↓ (on error)
    Mock Data (fallback)
```

---

## Context API Integration

### Updated Contexts

**PreHireContext** (`contexts/PreHireContext.tsx`)
- ✅ API-enabled with loading/error states
- ✅ Automatic data fetching on mount
- ✅ Fallback to mock data on error
- ✅ All CRUD operations async

**PackageContext** (`contexts/PackageContext.tsx`)
- ✅ API-enabled for packages, hardware, software
- ✅ Fetches 3 collections in parallel on mount
- ✅ Fallback to mock data on error
- ✅ All CRUD operations async

### Context Props

Both contexts accept a `useMockData` prop:

```typescript
interface ProviderProps {
  children: ReactNode;
  useMockData?: boolean; // Default: false
}
```

**Examples:**

```tsx
// Option 1: API mode with automatic fallback (recommended)
<PreHireProvider>
  <PackageProvider>
    <App />
  </PackageProvider>
</PreHireProvider>

// Option 2: Force mock data mode (development)
<PreHireProvider useMockData={true}>
  <PackageProvider useMockData={true}>
    <App />
  </PackageProvider>
</PreHireProvider>

// Option 3: Force API mode (production)
<PreHireProvider useMockData={false}>
  <PackageProvider useMockData={false}>
    <App />
  </PackageProvider>
</PreHireProvider>
```

### New Context Features

**Loading State:**
```tsx
const { loading, error, preHires } = usePreHires();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

**Error Handling:**
```tsx
const { createPreHire } = usePreHires();

try {
  await createPreHire({ candidateName: 'Jane Doe', ... });
  showToast('Pre-hire created successfully', 'success');
} catch (error) {
  showToast(error.message, 'error');
}
```

**Manual Refresh:**
```tsx
const { refreshPreHires, refreshPackages } = usePreHires();

// Refresh data from API
await refreshPreHires();
await refreshPackages();
```

---

## Enabling/Disabling API Mode

### Method 1: Environment Variable (Recommended)

Create a `.env.local` file:

```env
# Backend API Configuration
VITE_USE_MOCK_DATA=false  # Set to 'true' to force mock data

# Backend URL (default: http://localhost:8080)
VITE_API_BASE_URL=http://localhost:8080
```

Update context providers in `App.tsx`:

```tsx
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

<PreHireProvider useMockData={useMockData}>
  <PackageProvider useMockData={useMockData}>
    <App />
  </PackageProvider>
</PreHireProvider>
```

### Method 2: Direct Prop (Quick Testing)

Hardcode the prop value in `App.tsx`:

```tsx
// Force mock data
<PreHireProvider useMockData={true}>

// Force API mode
<PreHireProvider useMockData={false}>

// Auto-detect (tries API, falls back to mock)
<PreHireProvider>
```

### Method 3: Runtime Toggle (Advanced)

Add a settings UI to toggle between modes:

```tsx
const [useMockData, setUseMockData] = useState(false);

// Settings panel
<Toggle
  checked={useMockData}
  onChange={setUseMockData}
  label="Use Mock Data"
/>

<PreHireProvider useMockData={useMockData}>
  ...
</PreHireProvider>
```

---

## Backend Setup

### Prerequisites

```bash
node --version  # v18.x or higher
npm --version   # v9.x or higher
```

### Installation

```bash
cd backend
npm install
```

**Dependencies installed:**
- express - Web framework
- cors - Cross-origin resource sharing
- dotenv - Environment variables
- node-fetch - HTTP client
- jsonwebtoken - JWT validation
- jwks-rsa - Azure AD key retrieval

### Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=8080

# Azure AD Integration (for interact.interpublic.com proxy)
API_BASE_URL=https://interact.interpublic.com
CLIENT_ID=YourClientID
CLIENT_SECRET=YourClientSecret

# Azure AD Group Security
REQUIRED_GROUP_ID=2c08b5d8-7def-4845-a48c-740b987dcffb
```

### Start Backend Server

```bash
cd backend
node server.js
```

**Expected Output:**
```
[DB] Created database directory: /path/to/backend/database/data
[DB] Initialized preHires: .../pre-hires.json
[DB] Initialized packages: .../packages.json
[DB] Initialized hardware: .../hardware.json
[DB] Initialized software: .../software.json
[DB] Initialized approvals: .../approvals.json
[DB] Initialized roleAssignments: .../role-assignments.json
[DB] Initialized licenseAssignments: .../license-assignments.json
Note Crafter Backend API listening on port 8080
API Base URL: https://interact.interpublic.com
Client ID configured: Yes
Client Secret configured: Yes
Azure AD Group Security: Enabled
Required Group: MOM WW All Users 1 SG (2c08b5d8-7def-4845-a48c-740b987dcffb)
```

### Verify Backend Health

```bash
# Health check
curl http://localhost:8080/health
# Expected: "healthy"

# Test API (requires authentication)
curl http://localhost:8080/api/pre-hires
# Expected: 401 Unauthorized (because no auth token)
```

---

## Testing Guide

### Test 1: Frontend with Mock Data (No Backend)

**Goal:** Verify app works without backend

**Steps:**
1. Don't start backend server
2. Set `useMockData={true}` in providers
3. Run frontend: `npm run dev`
4. Open http://localhost:5173
5. Verify pre-hires and packages load from mock data

**Expected Result:**
- ✅ App loads successfully
- ✅ Mock data displayed (3 pre-hires, 6 packages)
- ✅ CRUD operations work (data in memory only)
- ✅ No console errors

### Test 2: Backend JSON File Creation

**Goal:** Verify backend creates database files

**Steps:**
1. Delete `backend/database/data/` folder (if exists)
2. Start backend: `cd backend && node server.js`
3. Check console output for initialization messages
4. Verify files created: `ls backend/database/data/`

**Expected Result:**
```
pre-hires.json
packages.json
hardware.json
software.json
approvals.json
role-assignments.json
license-assignments.json
```

**Initial File Contents:** `[]` (empty array)

### Test 3: Frontend → Backend Integration

**Goal:** Verify frontend can communicate with backend

**Prerequisites:**
- Backend running on port 8080
- Frontend running on port 5173

**Steps:**
1. Set `useMockData={false}` in providers
2. Open browser DevTools → Network tab
3. Reload frontend
4. Check for API calls to `/api/pre-hires`, `/api/packages`, `/api/hardware`, `/api/software`

**Expected Console Output (Frontend):**
```
[PreHireContext] Fetching pre-hires from API...
[PackageContext] Fetching packages from API...
[PackageContext] Fetching hardware from API...
[PackageContext] Fetching software from API...
```

**Expected Console Output (Backend):**
```
GET /api/pre-hires
GET /api/packages
GET /api/hardware
GET /api/software
```

**Expected Result:**
- ✅ API calls successful (200 OK)
- ✅ Empty data arrays returned `{ data: [], pagination: {...} }`
- ✅ No errors in console

### Test 4: Create Pre-Hire (End-to-End)

**Goal:** Test complete CRUD workflow

**Steps:**
1. Ensure backend is running
2. Frontend with `useMockData={false}`
3. Navigate to Pre-hires section
4. Click "Create New Pre-hire"
5. Fill out form:
   - Candidate Name: "Test User"
   - Email: "test@example.com"
   - Role: "Developer"
   - Department: "Engineering"
   - Start Date: (future date)
   - Hiring Manager: "Your Name"
6. Click "Create"

**Expected Backend Console:**
```
POST /api/pre-hires - Creating pre-hire: Test User
[PreHireRoutes] Pre-hire created successfully: pre-1234567890
```

**Verify in JSON File:**
```bash
cat backend/database/data/pre-hires.json
```

**Expected Content:**
```json
[
  {
    "id": "pre-1234567890",
    "candidateName": "Test User",
    "email": "test@example.com",
    "role": "Developer",
    ...
  }
]
```

**Expected Frontend:**
- ✅ Success toast notification
- ✅ New pre-hire appears in list
- ✅ No console errors

### Test 5: Update Pre-Hire

**Steps:**
1. Click "Edit" on the pre-hire created in Test 4
2. Change candidate name to "Test User (Updated)"
3. Click "Save"

**Expected Result:**
- ✅ PUT request to `/api/pre-hires/:id`
- ✅ JSON file updated with new name
- ✅ UI updates without page reload

### Test 6: Delete Pre-Hire

**Steps:**
1. Click "Delete" on the test pre-hire
2. Confirm deletion

**Expected Result:**
- ✅ DELETE request to `/api/pre-hires/:id`
- ✅ Pre-hire removed from JSON file
- ✅ UI removes item immediately

### Test 7: Fallback to Mock Data

**Goal:** Verify graceful degradation when API fails

**Steps:**
1. Set `useMockData={false}`
2. Stop backend server
3. Reload frontend

**Expected Console Output:**
```
[PreHireContext] Error fetching pre-hires: Failed to fetch
[PreHireContext] Falling back to mock data
[PackageContext] Error fetching packages: Failed to fetch
[PackageContext] Falling back to mock data
```

**Expected Result:**
- ✅ App still loads
- ✅ Mock data displayed
- ✅ Error message shown in UI (optional)
- ✅ User can continue using app with mock data

---

## Troubleshooting

### Issue: "MSAL not initialized"

**Error:**
```
Error: MSAL not initialized
```

**Cause:** API service trying to get auth token before MSAL is ready

**Solution:**
- Ensure `AuthGuard` wraps the entire app
- Check that `msalInstance` is injected to window in `AuthGuard.tsx`
- Try adding a delay or loading state before rendering providers

### Issue: CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8080/api/pre-hires' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Cause:** Backend not allowing requests from frontend origin

**Solution:**
```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend
  credentials: true
}));
```

### Issue: 401 Unauthorized

**Error:**
```
HTTP 401: Unauthorized
error_description: "User not authenticated"
```

**Cause:** Missing or invalid Azure AD token

**Solution:**
- Ensure user is logged in via MSAL
- Check Azure AD app permissions (User.Read)
- Verify token is being sent in Authorization header
- Check console for token acquisition errors

### Issue: 403 Forbidden

**Error:**
```
HTTP 403: Forbidden
message: "Insufficient permissions"
requiredPermission: "PREHIRE_CREATE"
```

**Cause:** User doesn't have required RBAC permission

**Solution:**
- Check user's Azure AD group membership
- Verify user is in "MOM Tech Admin Users SG" group (for admin permissions)
- Check RBAC configuration in `backend/config/rbac.js`
- Ensure `getUserRolesFromGroups()` is mapping groups correctly

### Issue: Empty Data After Page Reload

**Symptom:** Data disappears after refreshing page

**Cause:** JSON files being overwritten or not persisted

**Solution:**
- Check file permissions on `backend/database/data/`
- Ensure backend is writing files correctly
- Verify `writeData()` function in `backend/database/db.js`
- Check for file locking issues (Windows)

### Issue: Loading State Stuck

**Symptom:** Spinner shows forever, data never loads

**Cause:** API request hanging or context not updating state

**Solution:**
1. Check browser Network tab for failed requests
2. Add timeout to fetch requests
3. Check console for JavaScript errors
4. Verify `setLoading(false)` is called in finally block
5. Add request timeout:

```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000) // 10 second timeout
});
```

### Issue: Stale Data

**Symptom:** Changes not reflected in UI

**Cause:** State not updating after API calls

**Solution:**
- Ensure `setPreHires()` or `setPackages()` is called after API response
- Check that API is returning updated data
- Add manual refresh button as workaround
- Verify response data format matches expected type

---

## Production Deployment Considerations

### Environment Variables

**Frontend:**
```env
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Backend:**
```env
PORT=8080
API_BASE_URL=https://interact.interpublic.com
CLIENT_ID=ProductionClientID
CLIENT_SECRET=ProductionClientSecret
NODE_ENV=production
```

### Database Migration

When ready to migrate from JSON files to PostgreSQL/MongoDB:

1. **Install database driver:**
```bash
npm install pg  # PostgreSQL
# OR
npm install mongodb  # MongoDB
```

2. **Update `backend/database/db.js`:**
   - Replace `readData()` with SQL queries
   - Replace `writeData()` with SQL inserts/updates
   - Keep same function signatures for compatibility

3. **No frontend changes needed** - API contract stays the same

### Security Hardening

**Backend:**
- ✅ Enable HTTPS only
- ✅ Validate all inputs
- ✅ Rate limiting on API endpoints
- ✅ Sanitize error messages (don't leak stack traces)
- ✅ Move secrets to Azure Key Vault

**Frontend:**
- ✅ Content Security Policy headers
- ✅ CSRF protection
- ✅ XSS prevention (already handled by React)

---

## Summary

### Current State

✅ **Backend API:** 27 endpoints across 5 modules
✅ **Context Integration:** PreHire and Package contexts API-enabled
✅ **Fallback Strategy:** Automatic mock data on errors
✅ **Loading States:** Built-in loading and error handling
✅ **RBAC Security:** Azure AD group-based permissions
✅ **JSON Database:** Auto-initialized file storage

### How to Use

**Development (Mock Data):**
```tsx
<PreHireProvider useMockData={true}>
```

**Development (With Backend):**
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
npm run dev
```

**Production:**
```tsx
<PreHireProvider useMockData={false}>
```

### Next Steps

1. Update remaining contexts (ApprovalContext, LicenseContext)
2. Add loading spinners to all components
3. Add error boundaries for graceful error handling
4. Migrate from JSON files to PostgreSQL/MongoDB
5. Deploy to Cloud Run with proper environment variables

---

## Quick Reference

| Task | Command |
|------|---------|
| Start Backend | `cd backend && node server.js` |
| Start Frontend | `npm run dev` |
| Check Health | `curl http://localhost:8080/health` |
| View JSON Data | `cat backend/database/data/pre-hires.json` |
| Enable Mock Data | Set `useMockData={true}` |
| Force API Mode | Set `useMockData={false}` |
| Test API | Check Network tab in DevTools |

---

**Last Updated:** 2025-01-22
**Version:** 1.0.0
