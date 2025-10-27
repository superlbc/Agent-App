# Azure AD API Permissions Setup

**App Name:** MOM Meeting Transcript Agent POC
**App ID:** `5fa64631-ea56-4676-b6d5-433d322a4da1`
**Tenant ID:** `d026e4c1-5892-497a-b9da-ee493c9f0364`

---

## Required API Permissions

Add these **Microsoft Graph** delegated permissions to your app registration:

### Core Permissions (Required)

**Standard User Consent (No Admin Required):**

| Permission | Type | Admin Consent? | Purpose | Status |
|------------|------|----------------|---------|--------|
| ✅ **User.Read** | Delegated | ❌ No | Sign in and read user profile | Already added |
| ✅ **profile** | Delegated | ❌ No | OpenID Connect basic profile | Already added |
| ✅ **openid** | Delegated | ❌ No | OpenID Connect sign-in | Already added |
| ✅ **Calendars.Read** | Delegated | ❌ No | Read user's calendar events | Already added |
| ✅ **OnlineMeetings.Read** | Delegated | ❌ No | Read meeting details | Already added |
| ✅ **Files.Read** | Delegated | ❌ No | Access OneDrive files (fallback for transcripts) | Already added |

**Admin Consent Required (Approved):**

| Permission | Type | Admin Consent? | Purpose | Status |
|------------|------|----------------|---------|--------|
| ✅ **OnlineMeetingTranscript.Read.All** | Delegated | ✅ **YES** | **Read meeting transcripts from Graph API** | ✅ **Admin approved** |
| ✅ **User.Read.All** | Delegated | ✅ **YES** | Read full profiles of all users (job title, dept, photo) | ✅ **Admin approved** |
| ✅ **Presence.Read.All** | Delegated | ✅ **YES** | Read presence information (online/offline status) | ✅ **Admin approved** |

---

## Step-by-Step Instructions

### 1. Open Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with admin credentials
3. Navigate to **Azure Active Directory**
4. Click **App registrations** in left sidebar
5. Find your app: **MOM Meeting Transcript Agent POC**

### 2. Add Missing Permissions

1. Click **API permissions** in left sidebar
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**

### 3. Add Each Permission

**For Calendars.Read:**
- Search: `Calendars.Read`
- Check the box
- Click **Add permissions**

**For OnlineMeetings.Read:**
- Click **+ Add a permission** again
- Select **Microsoft Graph** > **Delegated permissions**
- Search: `OnlineMeetings.Read`
- Check the box
- Click **Add permissions**

**For Files.Read:**
- Click **+ Add a permission** again
- Select **Microsoft Graph** > **Delegated permissions**
- Search: `Files.Read`
- Check the box
- Click **Add permissions**

### 4. Grant Admin Consent

**IMPORTANT:** After adding all three permissions:

1. Click **Grant admin consent for [Your Organization]** button (top of permissions list)
2. Confirm the consent dialog
3. All permissions should now show ✅ green checkmarks in "Admin consent" column

---

## Verification Checklist

After adding permissions, verify your app has these 9 delegated permissions:

**Standard Permissions:**
- [x] User.Read
- [x] profile
- [x] openid
- [x] Calendars.Read
- [x] OnlineMeetings.Read
- [x] Files.Read

**Admin-Approved Permissions:**
- [x] OnlineMeetingTranscript.Read.All ⚠️ **CRITICAL - Required for transcript retrieval**
- [x] User.Read.All
- [x] Presence.Read.All

The 3 admin-approved permissions should have **✅ green checkmark** in "Admin consent" column.

---

## What Happens Next?

### Existing Users

**Users who are already logged in will see an error** until they:
1. Log out of the app
2. Clear browser cache/session storage (or just close all tabs)
3. Log back in
4. They'll see a consent prompt with the new permissions
5. Click "Accept"

### New Users

- Will automatically see consent prompt for all 6 permissions on first login
- One-time consent covers all features

---

## Testing After Adding Permissions

### Quick Test (Browser)

1. Open the test page: `tests/graph-api-test.html`
2. Run the server: `npx http-server tests -p 3000`
3. Open http://localhost:3000/graph-api-test.html
4. Click **Sign in with Microsoft 365**
5. Accept consent prompt
6. All 6 tests should pass ✅

### Full App Test

1. Clear browser session storage:
   ```javascript
   // In browser console:
   sessionStorage.clear();
   localStorage.clear();
   ```

2. Reload the app and log in

3. Navigate to "Generate Notes" page

4. Click **"Select Meeting"** tab

5. You should see:
   - Week view calendar
   - Your recent meetings
   - Click a meeting → auto-populate form

---

## Troubleshooting

### Error: "AADSTS65001: The user or administrator has not consented"

**Solution:**
1. Verify you added all 3 new permissions in Azure Portal
2. Click "Grant admin consent" button
3. User must log out and log back in

### Error: "403 Forbidden" on Calendar API

**Solution:**
1. Check that `Calendars.Read` is added with admin consent ✅
2. User needs to re-login to get new token with updated scopes

### Error: "Files.Read not in token claims"

**Solution:**
1. Verify `Files.Read` is added in Azure Portal
2. Grant admin consent
3. Clear session storage and re-login

---

## Summary

**All Permissions Configured:** ✅ Complete

**Total Permissions:** 9 delegated permissions
- 6 standard (user consent)
- 3 admin-approved (OnlineMeetingTranscript.Read.All, User.Read.All, Presence.Read.All)

**Key Permission:** `OnlineMeetingTranscript.Read.All`
- This is the critical permission that enables automatic transcript retrieval
- Requires admin consent
- Without it, users must manually paste transcripts

**Result:** Users can now:
- ✅ Select meetings from their Teams calendar (±4 weeks)
- ✅ Auto-fetch meeting details, agenda, and all participants
- ✅ Auto-retrieve transcripts directly from Graph API
- ✅ Generate notes in ~20 seconds (vs. 2-3 minutes manually)
- ✅ 100% automated workflow with zero manual data entry

---

**Updated:** 2025-10-27
**Test Results:** [IPG-TENANT-TEST-RESULTS.md](./IPG-TENANT-TEST-RESULTS.md)
**Architecture:** [MEETING-SELECTION-ARCHITECTURE.md](./MEETING-SELECTION-ARCHITECTURE.md)
