# Microsoft Graph API Testing Suite

This folder contains testing tools to verify which Microsoft Graph API endpoints work in your Microsoft 365 tenant **before implementing the meeting selection feature**.

---

## 📋 Overview

The meeting selection feature requires access to:
1. **Calendar Events** - To show user's meetings
2. **Meeting Details** - To get attendees and agenda
3. **Transcripts** - To auto-fetch meeting transcripts

This test suite helps you:
- ✅ Verify which endpoints work in your tenant
- ✅ Determine the optimal transcript retrieval strategy
- ✅ Identify permission issues before development
- ✅ Document findings for IT/stakeholders

---

## 🧪 Available Tests

### 1. [graph-api-test.html](graph-api-test.html) - **Browser-Based Test (RECOMMENDED)**
**Best for:** Quick testing, visual results, non-technical users

**Features:**
- ✨ Beautiful visual interface
- 🔐 Interactive Microsoft login
- 📊 Real-time test results
- 💾 Export results as JSON
- 📋 Copy markdown report

**Run:**
1. Open [graph-api-test.html](graph-api-test.html) in a browser
2. Enter your Azure AD Client ID and Tenant ID
3. Click "Sign in with Microsoft"
4. Run tests individually or all at once

---

### 2. [graph-api-test.js](graph-api-test.js) - **Node.js Test Script**
**Best for:** Automated testing, CI/CD integration, backend verification

**Features:**
- 🖥️ Command-line interface
- 🔁 Device code authentication
- 📝 Detailed console output
- 💾 Auto-saves results to JSON

**Run:**
```bash
# Install dependencies
npm install @azure/msal-node @microsoft/microsoft-graph-client isomorphic-fetch

# Set environment variables
export AZURE_CLIENT_ID="your-client-id"
export AZURE_TENANT_ID="your-tenant-id"

# Run tests
node graph-api-test.js
```

---

### 3. [TEST-RESULTS-TEMPLATE.md](TEST-RESULTS-TEMPLATE.md) - **Results Documentation Template**
**Best for:** Documenting findings for team/stakeholders

**Use:**
1. Copy template
2. Fill in test results
3. Add to project docs
4. Share with IT for permission requests

---

## 🚀 Quick Start Guide

### Prerequisites

**Before testing, you need:**
1. Azure AD App Registration (see [Setup Instructions](#setup-azure-ad-app-registration))
2. Redirect URI configured
3. API permissions added (even if not yet consented)

### Step-by-Step

#### Option A: Browser Test (Easiest)

1. **Register Azure AD App** (see below)

2. **Open the test page:**
   ```bash
   # Navigate to tests folder
   cd tests

   # Open in browser (or double-click file)
   start graph-api-test.html  # Windows
   open graph-api-test.html   # Mac
   ```

3. **Configure:**
   - Enter your **Client ID** (from Azure AD app)
   - Enter your **Tenant ID** (from Azure AD)

4. **Authenticate:**
   - Click "Sign in with Microsoft"
   - Login with your Microsoft 365 account
   - Consent to permissions

5. **Run Tests:**
   - Click "Run All Tests" (or run individually)
   - Wait for results (~30 seconds)

6. **Export Results:**
   - Click "Export Results as JSON" to save
   - Click "Copy Markdown Report" to share

---

#### Option B: Node.js Test (For Developers)

1. **Install dependencies:**
   ```bash
   npm install @azure/msal-node @microsoft/microsoft-graph-client isomorphic-fetch
   ```

2. **Set environment variables:**
   ```bash
   # Windows (Command Prompt)
   set AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
   set AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321

   # Windows (PowerShell)
   $env:AZURE_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
   $env:AZURE_TENANT_ID="87654321-4321-4321-4321-cba987654321"

   # Mac/Linux
   export AZURE_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
   export AZURE_TENANT_ID="87654321-4321-4321-4321-cba987654321"
   ```

3. **Run:**
   ```bash
   node graph-api-test.js
   ```

4. **Authenticate:**
   - Follow the device code instructions in console
   - Visit https://microsoft.com/devicelogin
   - Enter the code shown
   - Login and consent

5. **View Results:**
   - Console output shows real-time results
   - Full results saved to `graph-api-test-results.json`

---

## ⚙️ Setup: Azure AD App Registration

### Step 1: Register App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**

**Settings:**
- **Name:** `Momo Meeting Notes - Testing`
- **Supported account types:** Single tenant (your organization only)
- **Redirect URI:**
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:3000` (or wherever you'll run tests)

4. Click **Register**

### Step 2: Note Your IDs

After registration, copy these values:
- **Application (client) ID** - e.g., `12345678-1234-1234-1234-123456789abc`
- **Directory (tenant) ID** - e.g., `87654321-4321-4321-4321-cba987654321`

### Step 3: Add API Permissions

1. Go to **API permissions** in your app
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**

Add these permissions:
- ✅ `User.Read` - Read user profile
- ✅ `Calendars.Read` - Read calendar
- ✅ `OnlineMeetings.Read` - Read meeting details
- ✅ `OnlineMeetingTranscript.Read` - Read transcripts
- ✅ `Files.Read` - Read OneDrive files

3. Click **Add permissions**

**Note:** You don't need admin consent yet - the test will show which permissions work!

### Step 4: Configure Redirect URI (for browser test)

1. Go to **Authentication** in your app
2. Under **Single-page application**, add:
   - `http://localhost:3000` (or your test page URL)
   - `file://` (if running locally)

3. Save

---

## 📊 Understanding Test Results

### Test 1: User Profile ✅
**What it tests:** Basic API connectivity and authentication

**If it fails:**
- ❌ Authentication issue
- ❌ Network/firewall blocking Graph API
- ❌ Invalid Client ID or Tenant ID

---

### Test 2: Calendar Events ✅
**What it tests:** Access to user's calendar

**Required permission:** `Calendars.Read`

**If it fails:**
- ❌ Permission not granted/consented
- ❌ User doesn't have a calendar (unlikely)

**If it passes:**
- ✅ Calendar integration will work!
- 📌 Notes which meeting to use for transcript tests

---

### Test 3: Meeting Details ✅
**What it tests:** Ability to get meeting attendees, agenda, join URL

**Required permission:** `Calendars.Read`

**If it fails:**
- ❌ Same as calendar test (uses same permission)

**If it passes:**
- ✅ Can auto-populate attendees and agenda!

---

### Test 4: Transcript Strategy 1 (OnlineMeetings API) 🔍
**What it tests:** Direct transcript access via Microsoft Graph API

**Required permission:** `OnlineMeetingTranscript.Read`

**If it passes (✅ BEST OUTCOME):**
- ✅ Use this as primary strategy!
- ✅ Fastest, most reliable
- ✅ No file name matching needed

**If it fails with 403:**
- ⚠️ Permission requires admin consent
- ⚠️ IT may need to approve
- 💡 Fall back to Strategy 2 or 3

**If it fails with 404:**
- ⚠️ Meeting doesn't have transcript (recording/transcription was off)
- ⚠️ Or endpoint not supported in your tenant

---

### Test 5: Transcript Strategy 2 (OneDrive) 📁
**What it tests:** Finding transcripts in OneDrive Recordings folder

**Required permission:** `Files.Read`

**If it passes (✅ GOOD FALLBACK):**
- ✅ Transcripts auto-saved to OneDrive
- ✅ Can search by meeting name
- ⚠️ File name matching may be fragile
- 💡 Use as fallback to Strategy 1

**If it fails with 404:**
- ❌ Recordings folder doesn't exist
- ❌ Auto-save not enabled in Teams admin
- 💡 Check Teams admin settings

---

### Test 6: Transcript Strategy 3 (Teams Chat Files) 💬
**What it tests:** Finding transcripts in Teams Chat Files folder

**Required permission:** `Files.Read`

**If it passes:**
- ✅ Alternative storage location
- ✅ Some orgs use this instead of Recordings

**If it fails:**
- ❌ Not used in your org
- 💡 Try Strategy 2 instead

---

## 🎯 Decision Matrix

Based on test results, choose your implementation strategy:

### Scenario A: Strategy 1 Works ✅
```
Primary: OnlineMeetings API
Fallback: Manual paste
```
**Implementation:**
- Use `/me/onlineMeetings/{id}/transcripts`
- Fastest, most reliable
- Best user experience

---

### Scenario B: Strategy 2 or 3 Works ✅
```
Primary: OneDrive/Teams Files search
Fallback: Manual paste
```
**Implementation:**
- Search OneDrive for transcript files
- Match by meeting subject + date
- Parse VTT or DOCX format

---

### Scenario C: All Strategies Fail ❌
```
Primary: Power Automate Flow
Fallback: Manual paste
```
**Implementation:**
- Deploy Power Automate flows (see [POWER-AUTOMATE-FLOWS.md](../docs/POWER-AUTOMATE-FLOWS.md))
- Flows use user's delegated permissions
- Slower but works without admin consent

---

### Scenario D: Everything Blocked 🚫
```
Primary: Manual paste only
```
**Implementation:**
- Keep current paste workflow
- Request IT review permissions

---

## 📝 After Testing

### 1. Document Results

Use [TEST-RESULTS-TEMPLATE.md](TEST-RESULTS-TEMPLATE.md):
```bash
cp TEST-RESULTS-TEMPLATE.md ../docs/TENANT-TEST-RESULTS.md
# Fill in your findings
```

### 2. Share with Stakeholders

**For IT:**
- Show which permissions are needed
- Explain why each permission is required
- Compare to Power Automate (same permissions, worse UX)

**For Development Team:**
- Document which strategy to implement
- Note any edge cases discovered
- Update architecture docs

### 3. Request Permissions (if needed)

**Email Template:**
```
Subject: Permission Request for Momo Meeting Notes App

Hi [IT Contact],

We've tested the Microsoft Graph API in our tenant and need the following
permissions for the Momo Meeting Notes app:

REQUIRED (Essential Functionality):
- User.Read - User profile
- Calendars.Read - Calendar access
- Files.Read - OneDrive access

OPTIONAL (Enhanced Experience):
- OnlineMeetingTranscript.Read - Direct transcript access

Test results show [describe what works/doesn't work].

Without these permissions, users must manually copy/paste transcripts
(current workflow). With permissions, the process is automated and
takes 5 seconds instead of 2 minutes per meeting.

Security notes:
- All permissions are delegated (users access only their own data)
- No org-wide access requested
- Full audit trail in Azure AD logs
- Can be revoked at any time

Test results attached: [TEST-RESULTS.md]

Please let me know if you need more information.

Thanks,
[Your Name]
```

---

## 🔧 Troubleshooting

### "AADSTS65001: The user or administrator has not consented"

**Solution:** You need to consent to permissions:
1. In test page: logout and login again
2. On consent screen: check all boxes and click Accept
3. If still failing: admin consent may be required

---

### "CORS error" in browser test

**Solution:**
1. Make sure redirect URI is configured in Azure AD
2. Use `http://localhost` not `file://`
3. Or run a local server:
   ```bash
   npx http-server . -p 3000
   # Open http://localhost:3000/graph-api-test.html
   ```

---

### "itemNotFound" for OneDrive folders

**Reasons:**
- Recordings folder doesn't exist (auto-save not enabled)
- User hasn't recorded any meetings yet
- Different storage location configured

**Check Teams Admin Settings:**
1. Go to Teams Admin Center
2. Meetings → Meeting policies
3. Check "Cloud recording" and "Transcription" settings

---

### "Forbidden" for transcript endpoints

**Reasons:**
- Permission requires admin consent
- Permission not added to app registration
- Transcript API not available in your license tier

**Solutions:**
- Request admin consent from IT
- Use Power Automate fallback
- Or keep manual paste workflow

---

### Node.js test hangs on device code

**Solution:**
1. Watch console for device code URL
2. Visit https://microsoft.com/devicelogin
3. Enter the code shown
4. Login and consent

If browser doesn't open automatically, copy/paste the URL.

---

## 📚 Related Documentation

- [MEETING-SELECTION-ARCHITECTURE.md](../docs/MEETING-SELECTION-ARCHITECTURE.md) - Full technical spec
- [MEETING-SELECTION-QUICK-REFERENCE.md](../docs/MEETING-SELECTION-QUICK-REFERENCE.md) - Quick reference
- [POWER-AUTOMATE-FLOWS.md](../docs/POWER-AUTOMATE-FLOWS.md) - Fallback solution

---

## ❓ FAQ

### Q: Do I need admin consent to run tests?
**A:** No! Tests use delegated permissions (you consent for yourself). However, test results will show which permissions require admin consent for production.

### Q: Will this access other users' data?
**A:** No. All tests use delegated permissions, accessing only YOUR calendar, meetings, and files.

### Q: Can I test in production tenant?
**A:** Yes, but recommend creating a dedicated test app registration to avoid affecting production. Tests are read-only and safe.

### Q: How long do tests take?
**A:** Browser test: ~30 seconds. Node.js test: ~1 minute (includes manual device code auth).

### Q: What if all transcript tests fail?
**A:** You have two options:
1. Use Power Automate flows as fallback (see docs)
2. Keep manual paste workflow (current functionality)

Both are valid solutions!

---

## 🆘 Need Help?

**If tests fail unexpectedly:**
1. Check Azure AD app configuration
2. Verify redirect URIs
3. Ensure permissions are added (even if not consented)
4. Check browser console for detailed errors
5. Try Node.js test for more verbose output

**If you're unsure what results mean:**
1. Review [Understanding Test Results](#understanding-test-results) section
2. Check [Decision Matrix](#decision-matrix)
3. Document findings in [TEST-RESULTS-TEMPLATE.md](TEST-RESULTS-TEMPLATE.md)

**Still stuck?**
- Review error messages in test output
- Check Microsoft Graph API documentation
- Consult with IT about tenant-specific policies

---

**Last Updated:** 2025-10-27
**Version:** 1.0
