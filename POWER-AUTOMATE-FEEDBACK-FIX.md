# Power Automate Feedback Email Template - Fix Documentation

> **Date**: 2025-10-29
> **Issue**: Email template failing due to incorrect Parse JSON structure
> **Impact**: Feedback emails not being sent
> **Status**: RESOLVED

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Correct Flow Structure](#correct-flow-structure)
4. [Step-by-Step Fix](#step-by-step-fix)
5. [Corrected Template](#corrected-template)
6. [Testing & Verification](#testing--verification)
7. [Prevention](#prevention)

---

## Problem Summary

### Symptoms
- Feedback submissions succeed from frontend
- Power Automate flow runs but email action fails
- Email template references undefined Parse JSON actions
- Template shows errors for `body('Parse_JSON_-_Browser_Context')` and `body('Parse_JSON_-_Error_Logs')`

### Event Payload Structure

**What the frontend sends** ([telemetryService.ts:184-201](utils/telemetryService.ts:184-201)):

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.0.0",
  "sessionId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "correlationId": "",
  "eventType": "feedback",
  "timestamp": "2025-10-29T14:30:00.000Z",
  "userContext": {
    "name": "Luis Bustos",
    "email": "luis.bustos@momentumww.com",
    "tenantId": "abc123-def456-ghi789"
  },
  "eventPayload": "{\"feedbackType\":\"comment\",\"priority\":\"medium\",\"title\":\"Luis is brilliant\",\"description\":\"Thank you for the toggles...\",\"browserContext\":{...},\"url\":\"https://...\",\"page\":\"/\",\"errorLogs\":{...}}"
}
```

**Key Point**: `eventPayload` is a **JSON STRING** that needs parsing, but once parsed, `browserContext` and `errorLogs` are **OBJECTS**, not strings.

---

## Root Cause Analysis

### Incorrect Assumption

The original template assumed that `browserContext` and `errorLogs` needed separate Parse JSON actions, treating them as JSON strings within the feedback payload.

**This is WRONG because:**
1. The `eventPayload` field is a JSON string ✅ (needs parsing)
2. But once parsed, `browserContext` is an OBJECT ❌ (does NOT need parsing)
3. And `errorLogs` is also an OBJECT ❌ (does NOT need parsing)

### What Was Wrong

**Original (INCORRECT) structure:**
```
HTTP Trigger
  ↓
Condition: eventType == "feedback"
  ↓ (If yes)
Parse_JSON_-_Main (parse envelope)                    ← Optional
  ↓
Parse_JSON_-_Feedback_Payload (parse eventPayload)    ← CORRECT
  ↓
Parse_JSON_-_Browser_Context (parse browserContext)   ← WRONG - already an object!
  ↓
Parse_JSON_-_Error_Logs (parse errorLogs)             ← WRONG - already an object!
  ↓
Compose (email template)
  ↓
Send Email
```

**Template tried to reference:**
- `body('Parse_JSON_-_Browser_Context')?['browser']` ❌ This action shouldn't exist
- `body('Parse_JSON_-_Error_Logs')?['errorCount']` ❌ This action shouldn't exist

---

## Correct Flow Structure

### Recommended Structure

```
HTTP Trigger (receives full event envelope)
  ↓
Condition: triggerBody()?['eventType'] == "feedback"
  ↓ (If yes)
Parse_JSON_-_Feedback_Payload
  Content: triggerBody()?['eventPayload']
  Schema: [Feedback Payload Schema - see below]
  ↓
Check_if_Error_Logs_Exist (optional condition)
  Condition: not(empty(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']))
  ↓
Compose (email template with corrected references)
  ↓
Send Email (use Compose output)
```

### Parse JSON Actions Required

**Only ONE Parse JSON action is needed:**

#### Parse_JSON_-_Feedback_Payload

**Content:**
```
triggerBody()?['eventPayload']
```

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "feedbackType": {
      "type": "string"
    },
    "priority": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "browserContext": {
      "type": "object",
      "properties": {
        "browser": { "type": "string" },
        "browserVersion": { "type": "string" },
        "userAgent": { "type": "string" },
        "platform": { "type": "string" },
        "platformVersion": { "type": "string" },
        "screenResolution": { "type": "string" },
        "viewportSize": { "type": "string" },
        "devicePixelRatio": { "type": "number" },
        "orientation": { "type": "string" },
        "isFullscreen": { "type": "boolean" },
        "deviceType": { "type": "string" },
        "touchSupported": { "type": "boolean" },
        "maxTouchPoints": { "type": "integer" },
        "language": { "type": "string" },
        "languages": {
          "type": "array",
          "items": { "type": "string" }
        },
        "timezone": { "type": "string" },
        "timezoneOffset": { "type": "integer" },
        "theme": { "type": "string" },
        "connectionEffectiveType": { "type": "string" },
        "connectionDownlink": { "type": "number" },
        "connectionRtt": { "type": "integer" },
        "connectionSaveData": { "type": "boolean" },
        "cookiesEnabled": { "type": "boolean" },
        "localStorageAvailable": { "type": "boolean" },
        "sessionStorageAvailable": { "type": "boolean" },
        "webWorkersSupported": { "type": "boolean" },
        "serviceWorkerSupported": { "type": "boolean" },
        "hardwareConcurrency": { "type": "integer" },
        "deviceMemory": { "type": "integer" }
      }
    },
    "url": {
      "type": "string"
    },
    "page": {
      "type": "string"
    },
    "errorLogs": {
      "type": "object",
      "properties": {
        "hasErrors": { "type": "boolean" },
        "errorCount": { "type": "integer" },
        "warningCount": { "type": "integer" },
        "recentErrors": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

---

## Step-by-Step Fix

### Step 1: Open Power Automate Flow

1. Navigate to [Power Automate](https://make.powerautomate.com)
2. Open your **Centralized Telemetry Flow**
3. Click **"Edit"**

### Step 2: Verify Condition

Ensure you have a condition that routes feedback events:

**Condition:**
- Left: `triggerBody()?['eventType']`
- Operator: `is equal to`
- Right: `feedback`

### Step 3: Remove Incorrect Parse JSON Actions

In the "If yes" branch (feedback events):

1. **DELETE** the `Parse_JSON_-_Browser_Context` action if it exists
2. **DELETE** the `Parse_JSON_-_Error_Logs` action if it exists

**Keep only:**
- `Parse_JSON_-_Feedback_Payload` (parses the eventPayload string)

### Step 4: Update Parse_JSON_-_Feedback_Payload Schema

Ensure the Parse JSON action has the correct schema (see [Correct Flow Structure](#correct-flow-structure) above).

**Content field:**
```
triggerBody()?['eventPayload']
```

This parses the JSON string into an object with `feedbackType`, `browserContext`, `errorLogs`, etc.

### Step 5: Update Compose Action (Email Template)

Replace the entire Compose action content with the corrected template (see [Corrected Template](#corrected-template) section below).

**Key Changes:**
- All envelope fields use `triggerBody()?['field']` directly
- All feedback fields use `body('Parse_JSON_-_Feedback_Payload')?['field']`
- Browser context uses `body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['field']`
- Error logs use `body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['field']`

### Step 6: Update Check_if_Error_Logs_Exist Condition (if exists)

If you have a condition to check for error logs:

**Old (WRONG):**
```
body('Parse_JSON_-_Error_Logs')?['hasErrors']
```

**New (CORRECT):**
```
body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['hasErrors']
```

Or use:
```
not(empty(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']))
```

### Step 7: Save and Test

1. Click **"Save"** (top-right)
2. Submit a test feedback from the app
3. Check flow run history
4. Verify email is sent successfully

---

## Corrected Template

Below is the complete, corrected Compose action content for the email template.

**Key Corrections Applied:**
- ✅ User context from `triggerBody()` directly (no Parse_JSON_-_Main needed)
- ✅ Feedback fields from `body('Parse_JSON_-_Feedback_Payload')`
- ✅ Browser context from `body('Parse_JSON_-_Feedback_Payload')?['browserContext']`
- ✅ Error logs from `body('Parse_JSON_-_Feedback_Payload')?['errorLogs']`

### Compose Action Content

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      background: #f3f4f6;
      padding: 20px;
    }

    .email-container {
      max-width: 1000px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }

    .header h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .header p {
      opacity: 0.95;
      font-size: 14px;
      font-weight: 500;
    }

    /* Content Area */
    .content {
      padding: 24px;
      background: #fafafa;
    }

    /* Cards Grid - Responsive 2-column layout */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    /* For mobile: force single column */
    @media (max-width: 768px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Full-width cards (for feedback details, user info, actions) */
    .card-full {
      grid-column: 1 / -1;
    }

    /* Card Styles */
    .card {
      background: white;
      padding: 18px 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 4px solid #667eea;
      transition: box-shadow 0.2s;
    }

    .card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.12);
    }

    /* Card variants with different colored borders */
    .card-primary { border-left-color: #667eea; }
    .card-purple { border-left-color: #9333ea; }
    .card-blue { border-left-color: #3b82f6; }
    .card-cyan { border-left-color: #06b6d4; }
    .card-green { border-left-color: #10b981; }
    .card-orange { border-left-color: #f59e0b; }
    .card-red { border-left-color: #ef4444; background: #fef2f2; }

    .card-header {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f3f4f6;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon {
      font-size: 18px;
    }

    /* Info Grid - Compact Layout */
    .info-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px 12px;
      align-items: baseline;
      font-size: 13px;
    }

    .info-label {
      font-weight: 600;
      color: #6b7280;
    }

    .info-value {
      color: #374151;
      word-break: break-word;
    }

    .info-value strong {
      color: #111827;
      font-weight: 600;
    }

    /* Priority Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #d1fae5; color: #065f46; }

    /* Metrics Row - Quick Stats */
    .metrics-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .metric-item {
      flex: 1;
      min-width: 120px;
      background: #f9fafb;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
    }

    .metric-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Code/Technical Text */
    code, .code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      color: #4b5563;
      border: 1px solid #e5e7eb;
    }

    /* Links */
    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Button */
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #5568d3;
      text-decoration: none;
    }

    /* Footer */
    .footer {
      background: #f9fafb;
      padding: 20px 24px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      margin: 4px 0;
    }

    /* Alert Box */
    .alert {
      padding: 12px 16px;
      background: #fef9c3;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 13px;
      color: #92400e;
    }

    .alert strong {
      font-weight: 700;
    }

    /* List Styling */
    ul {
      margin: 12px 0;
      padding-left: 24px;
    }

    li {
      margin: 6px 0;
      font-size: 13px;
      color: #4b5563;
    }

    /* Error Logs Specific */
    .error-list {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #fca5a5;
      margin-top: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .error-item {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #dc2626;
      padding: 6px 0;
      border-bottom: 1px solid #fee2e2;
      line-height: 1.6;
    }

    .error-item:last-child {
      border-bottom: none;
    }

    /* Responsive Typography */
    @media (max-width: 768px) {
      .header h1 { font-size: 22px; }
      .content { padding: 16px; }
      .card { padding: 14px 16px; }
      .info-grid { grid-template-columns: 100px 1fr; font-size: 12px; }
      .card-title { font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🔔 New Feedback Received</h1>
      <p>Meeting Notes Generator • Feedback System</p>
    </div>

    <div class="content">
      <!-- Single Column: Feedback Details -->
      <div class="cards-grid">
        <div class="card card-full card-primary">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">📝</span>
              Feedback Details
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">Type</div>
            <div class="info-value"><strong>@{toUpper(substring(body('Parse_JSON_-_Feedback_Payload')?['feedbackType'], 0, 1))}@{substring(body('Parse_JSON_-_Feedback_Payload')?['feedbackType'], 1, sub(length(body('Parse_JSON_-_Feedback_Payload')?['feedbackType']), 1))}</strong></div>

            <div class="info-label">Priority</div>
            <div class="info-value">
              <span class="badge badge-@{toLower(body('Parse_JSON_-_Feedback_Payload')?['priority'])}">
                @{body('Parse_JSON_-_Feedback_Payload')?['priority']}
              </span>
            </div>

            <div class="info-label">Title</div>
            <div class="info-value"><strong>@{body('Parse_JSON_-_Feedback_Payload')?['title']}</strong></div>

            <div class="info-label">Description</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['description']}</div>

            <div class="info-label">Page URL</div>
            <div class="info-value"><a href="@{body('Parse_JSON_-_Feedback_Payload')?['url']}">@{body('Parse_JSON_-_Feedback_Payload')?['url']}</a></div>

            <div class="info-label">Current Route</div>
            <div class="info-value"><code>@{body('Parse_JSON_-_Feedback_Payload')?['page']}</code></div>
          </div>
        </div>
      </div>

      <!-- Single Column: User Information -->
      <div class="cards-grid">
        <div class="card card-full card-purple">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">👤</span>
              Submitted By
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">Name</div>
            <div class="info-value"><strong>@{triggerBody()?['userContext']?['name']}</strong></div>

            <div class="info-label">Email</div>
            <div class="info-value"><a href="mailto:@{triggerBody()?['userContext']?['email']}">@{triggerBody()?['userContext']?['email']}</a></div>

            <div class="info-label">Timestamp</div>
            <div class="info-value">@{formatDateTime(triggerBody()?['timestamp'], 'dddd, MMMM dd, yyyy')} • @{formatDateTime(triggerBody()?['timestamp'], 'HH:mm:ss')} UTC</div>

            <div class="info-label">Session ID</div>
            <div class="info-value"><code>@{triggerBody()?['sessionId']}</code></div>
          </div>
        </div>
      </div>

      <!-- Two Column Grid: Browser & Device Split into Multiple Cards -->
      <div class="cards-grid">
        <!-- Card 1: Browser Information -->
        <div class="card card-blue">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">🌐</span>
              Browser
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">Browser</div>
            <div class="info-value"><strong>@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['browser']}</strong></div>

            <div class="info-label">Version</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['browserVersion']}</div>

            <div class="info-label">Language</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['language']}</div>

            <div class="info-label">Timezone</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['timezone']}</div>
          </div>
        </div>

        <!-- Card 2: Device & Display -->
        <div class="card card-cyan">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">📱</span>
              Device & Display
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">Device Type</div>
            <div class="info-value"><strong>@{toUpper(substring(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['deviceType'], 0, 1))}@{substring(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['deviceType'], 1, sub(length(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['deviceType']), 1))}</strong></div>

            <div class="info-label">Platform</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['platform']} @{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['platformVersion']}</div>

            <div class="info-label">Screen</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['screenResolution']} (@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['orientation']})</div>

            <div class="info-label">Viewport</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['viewportSize']}</div>

            <div class="info-label">Theme</div>
            <div class="info-value">@{toUpper(substring(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['theme'], 0, 1))}@{substring(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['theme'], 1, sub(length(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['theme']), 1))} mode</div>

            <div class="info-label">Display Mode</div>
            <div class="info-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['isFullscreen'], true), '⛶ Fullscreen', '⧉ Windowed')}</div>
          </div>
        </div>

        <!-- Card 3: Hardware & Performance -->
        <div class="card card-green">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">⚡</span>
              Hardware & Performance
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">CPU Cores</div>
            <div class="info-value"><strong>@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['hardwareConcurrency']}</strong> cores</div>

            <div class="info-label">Memory</div>
            <div class="info-value"><strong>@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['deviceMemory']}</strong> GB RAM</div>

            <div class="info-label">Pixel Ratio</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['devicePixelRatio']}x</div>

            <div class="info-label">Touch</div>
            <div class="info-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['touchSupported'], true), '✓ Yes', '✗ No')} (@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['maxTouchPoints']} points)</div>
          </div>
        </div>

        <!-- Card 4: Network & Connection -->
        <div class="card card-orange">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">📡</span>
              Network & Connection
            </div>
          </div>
          <div class="info-grid">
            <div class="info-label">Type</div>
            <div class="info-value"><strong>@{toUpper(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['connectionEffectiveType'])}</strong></div>

            <div class="info-label">Downlink</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['connectionDownlink']} Mbps</div>

            <div class="info-label">Latency</div>
            <div class="info-value">@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['connectionRtt']} ms</div>

            <div class="info-label">Data Saver</div>
            <div class="info-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['connectionSaveData'], true), '✓ Enabled', '✗ Disabled')}</div>
          </div>
        </div>

        <!-- Card 5: Software Features (Full width in 2nd row) -->
        <div class="card card-full card-primary">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">🔧</span>
              Software Features & Capabilities
            </div>
          </div>
          <div class="metrics-row">
            <div class="metric-item">
              <div class="metric-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['localStorageAvailable'], true), '✓', '✗')}</div>
              <div class="metric-label">LocalStorage</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['sessionStorageAvailable'], true), '✓', '✗')}</div>
              <div class="metric-label">SessionStorage</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['cookiesEnabled'], true), '✓', '✗')}</div>
              <div class="metric-label">Cookies</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['webWorkersSupported'], true), '✓', '✗')}</div>
              <div class="metric-label">Web Workers</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['serviceWorkerSupported'], true), '✓', '✗')}</div>
              <div class="metric-label">Service Workers</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conditional: Error Logs Card (Full Width) -->
      @{if(and(not(empty(body('Parse_JSON_-_Feedback_Payload')?['errorLogs'])), equals(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['hasErrors'], true)),
        concat('<div class="cards-grid">
          <div class="card card-full card-red">
            <div class="card-header">
              <div class="card-title">
                <span class="card-icon">⚠️</span>
                Console Error Logs Detected
              </div>
            </div>
            <div class="metrics-row">
              <div class="metric-item" style="border-color: #fca5a5;">
                <div class="metric-value" style="color: #dc2626;">', body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['errorCount'], '</div>
                <div class="metric-label" style="color: #dc2626;">Errors</div>
              </div>
              <div class="metric-item" style="border-color: #fcd34d;">
                <div class="metric-value" style="color: #f59e0b;">', body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['warningCount'], '</div>
                <div class="metric-label" style="color: #f59e0b;">Warnings</div>
              </div>
            </div>
            <div class="error-list">
              ', join(
                select(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['recentErrors'],
                  concat('<div class="error-item">', item(), '</div>')
                ), ''
              ), '
            </div>
            <div class="alert">
              <strong>⚠️ Action Required:</strong> Console errors detected. This may indicate a technical issue requiring immediate investigation.
            </div>
          </div>
        </div>'),
        '')}

      <!-- Single Column: Next Steps -->
      <div class="cards-grid">
        <div class="card card-full card-primary">
          <div class="card-header">
            <div class="card-title">
              <span class="card-icon">📋</span>
              Next Steps & Actions
            </div>
          </div>
          <p style="margin-bottom: 12px; font-size: 14px; color: #4b5563;">
            This feedback has been automatically saved to the App Feedback SharePoint list.
          </p>
          <ul>
            <li>Review details and assign to appropriate team member</li>
            <li>Update status in SharePoint: New → In Review → Planned → Completed</li>
            <li>Respond to critical priority items within 24 hours</li>
            @{if(and(not(empty(body('Parse_JSON_-_Feedback_Payload')?['errorLogs'])), equals(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['hasErrors'], true)), '<li style="color: #dc2626; font-weight: 700;">⚠️ Console errors detected - investigate technical issues immediately</li>', '')}
          </ul>
          <p style="text-align: center; margin-top: 16px;">
            <a href="https://yourdomain.sharepoint.com/sites/AppManagement/Lists/AppFeedback" class="btn">
              📋 Open SharePoint Feedback List
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Meeting Notes Generator • Feedback System</strong></p>
      <p>Automated notification • Do not reply to this email</p>
      <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
        Session: <code style="background: transparent; padding: 0; border: none;">@{triggerBody()?['sessionId']}</code> •
        Type: @{body('Parse_JSON_-_Feedback_Payload')?['feedbackType']} •
        Priority: @{body('Parse_JSON_-_Feedback_Payload')?['priority']}<br/>
        Generated: @{formatDateTime(utcNow(), 'yyyy-MM-dd HH:mm:ss')} UTC
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Testing & Verification

### Pre-Deployment Checklist

Before saving your changes:

- [ ] Parse_JSON_-_Browser_Context action removed (or not created)
- [ ] Parse_JSON_-_Error_Logs action removed (or not created)
- [ ] Parse_JSON_-_Feedback_Payload schema updated with browserContext and errorLogs as objects
- [ ] All `body('Parse_JSON_-_Main')` references changed to `triggerBody()`
- [ ] All `body('Parse_JSON_-_Browser_Context')` references changed to `body('Parse_JSON_-_Feedback_Payload')?['browserContext']`
- [ ] All `body('Parse_JSON_-_Error_Logs')` references changed to `body('Parse_JSON_-_Feedback_Payload')?['errorLogs']`

### Test Submission

1. **Submit test feedback:**
   - Open Meeting Notes Generator
   - Click feedback button (bottom-right)
   - Fill form with test data
   - Submit

2. **Verify flow execution:**
   - Go to Power Automate
   - Check flow run history
   - Verify all actions succeeded
   - Check for green checkmarks

3. **Verify email:**
   - Check your inbox
   - Open feedback email
   - Verify all fields populated correctly
   - Check for missing data or errors

### Common Test Scenarios

**Scenario 1: Feedback without errors**
- Submit feedback with no console errors
- Verify error logs section is hidden in email

**Scenario 2: Feedback with console errors**
- Run `console.error("Test error")` in browser
- Submit feedback
- Verify error logs section appears in email

**Scenario 3: Different priorities**
- Submit feedback with each priority (critical, high, medium, low)
- Verify badge colors are correct

**Scenario 4: Different feedback types**
- Submit each type (bug, feature, comment, performance, documentation)
- Verify type is capitalized correctly

---

## Prevention

### Best Practices for Power Automate Email Templates

1. **Understand JSON Structure:**
   - Know which fields are JSON strings (need parsing)
   - Know which fields are already objects (access directly)

2. **Minimize Parse JSON Actions:**
   - Only parse JSON strings
   - Don't parse objects that are already parsed
   - Use direct object access: `body('action')?['nestedObject']?['field']`

3. **Use Trigger Body Directly:**
   - For top-level fields: `triggerBody()?['field']`
   - No need for separate Parse JSON action for the envelope

4. **Test Incrementally:**
   - Test after each major change
   - Use flow test feature with sample payloads
   - Verify each reference before adding more

5. **Document Your Flow:**
   - Add descriptions to each action
   - Document what each Parse JSON action parses
   - Keep a reference of the expected payload structure

### Reference: Parse JSON Decision Tree

```
Is the field a JSON STRING?
├─ Yes → Create Parse JSON action
│   Example: triggerBody()?['eventPayload'] = "{...json...}"
│
└─ No (it's already an object) → Access directly
    Example: body('ParsedAction')?['browserContext']?['browser']
```

---

## Quick Reference

### Correct Reference Patterns

| Data Location | Correct Reference | Wrong Reference |
|--------------|-------------------|-----------------|
| User name | `triggerBody()?['userContext']?['name']` | `body('Parse_JSON_-_Main')?['userContext']?['name']` |
| Feedback type | `body('Parse_JSON_-_Feedback_Payload')?['feedbackType']` | ✓ Correct |
| Browser name | `body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['browser']` | `body('Parse_JSON_-_Browser_Context')?['browser']` |
| Error count | `body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['errorCount']` | `body('Parse_JSON_-_Error_Logs')?['errorCount']` |
| Session ID | `triggerBody()?['sessionId']` | `body('Parse_JSON_-_Main')?['sessionId']` |
| Timestamp | `triggerBody()?['timestamp']` | `body('Parse_JSON_-_Main')?['timestamp']` |

---

## Support

If you continue to experience issues after applying this fix:

1. **Check flow run history** - Look for specific error messages
2. **Review Parse JSON schemas** - Ensure they match the actual payload
3. **Test with simple payload** - Use manual trigger with minimal data
4. **Verify endpoint** - Ensure `appConfig.ts` has correct URL
5. **Contact support** - Provide flow run ID and error details

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Author**: IPCT Team
**Status**: RESOLVED
