# User Feedback System - Power Automate Setup Guide

> **Version**: 1.0
> **Last Updated**: October 23, 2025
> **Application**: Meeting Notes Generator

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [SharePoint List Setup](#sharepoint-list-setup)
5. [Power Automate Flow Configuration](#power-automate-flow-configuration)
6. [Conditional Routing Logic](#conditional-routing-logic)
7. [Power App for Triage](#power-app-for-triage)
8. [Testing the Integration](#testing-the-integration)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Overview

The Meeting Notes Generator includes a standardized user feedback system that allows users to submit bug reports, feature requests, and general feedback directly from the application. This guide provides step-by-step instructions for setting up the backend infrastructure to receive, route, and manage user feedback.

### Key Features

- **Reuses Existing Telemetry Infrastructure**: Feedback events flow through the same Power Automate endpoint as other telemetry events
- **Conditional Routing**: Power Automate distinguishes feedback events from other telemetry and routes them to a SharePoint list
- **Rich Context**: Feedback submissions include browser/device info, current page URL, and console error logs
- **Multi-Language Support**: Feedback can be submitted in English, Spanish, or Japanese
- **Triage-Ready**: SharePoint list structured for easy triage via Power App

### Benefits

- ✅ **Single Endpoint**: No additional infrastructure needed - reuses existing telemetry flow
- ✅ **Centralized Storage**: All feedback in one SharePoint list for easy management
- ✅ **Power App Triage**: No premium connectors required for triage interface
- ✅ **Automatic Context**: Technical details captured automatically for debugging
- ✅ **Scalable**: Works across multiple applications using the same pattern

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Meeting Notes Generator (Browser)                              │
│                                                                  │
│  User clicks Feedback Button                                    │
│  ↓                                                              │
│  FeedbackModal (form with type, priority, title, description)   │
│  ↓                                                              │
│  feedbackService.ts                                             │
│  - Captures browser context (via browserContext.ts)             │
│  - Captures current page URL                                    │
│  - Captures console error logs (via errorLogger.ts)             │
│  - Calls telemetryService.trackEvent('feedback', payload)       │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP POST
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Power Automate - Centralized Telemetry Flow                    │
│  (HTTP Trigger)                                                  │
│                                                                  │
│  Receives Event Envelope:                                       │
│  {                                                              │
│    appName: "Meeting Notes Generator",                         │
│    eventType: "feedback",                                      │
│    userContext: { name, email, tenantId },                     │
│    eventPayload: "{ feedbackType, priority, ... }"            │
│  }                                                              │
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │ Condition: eventType == "feedback"?         │               │
│  └─────────────────┬───────────────────────────┘               │
│                    │                                            │
│         ┌──────────┴───────────┐                               │
│         │ YES                  │ NO                            │
│         ↓                      ↓                               │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │ Parse Payload   │    │ Other telemetry │                   │
│  │ Create Item in  │    │ (existing logic)│                   │
│  │ SharePoint List │    └─────────────────┘                   │
│  └─────────────────┘                                           │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Create Item
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  SharePoint List: "App Feedback"                                │
│                                                                  │
│  Columns:                                                        │
│  - Title (feedback title)                                       │
│  - App Name                                                      │
│  - Feedback Type (bug, feature, comment, performance, docs)     │
│  - Priority (critical, high, medium, low)                       │
│  - Description (multiline text)                                 │
│  - Submitted By (person)                                        │
│  - Submitted Date (date/time)                                   │
│  - Status (new, in-review, planned, completed, wontfix)         │
│  - Assigned To (person)                                         │
│  - Browser Context (JSON)                                       │
│  - Page URL                                                      │
│  - Error Logs (JSON)                                            │
│  - Session ID                                                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Access
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Power App: "App Feedback Triage"                               │
│                                                                  │
│  Features:                                                       │
│  - Gallery view with filters (type, priority, status)           │
│  - Detail view with all context                                 │
│  - Status update dropdown                                       │
│  - Assignment capability                                        │
│  - Comments/notes field                                         │
│  - No premium connectors (standard SharePoint connector)        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: User clicks feedback button, fills form, submits
2. **Context Capture**: Frontend automatically captures browser/device info, URL, errors
3. **Event Transmission**: Feedback sent to existing telemetry endpoint as `eventType: "feedback"`
4. **Conditional Routing**: Power Automate checks if event is feedback type
5. **SharePoint Storage**: Feedback events saved to SharePoint list with structured columns
6. **Triage**: Team uses Power App to review, assign, and update status

---

## Prerequisites

### Required Access & Permissions

- **Power Automate**: Ability to create and edit flows in your organization's environment
- **SharePoint**: Site owner or member permissions to create lists
- **Power Apps**: Ability to create canvas apps (no premium license required)

### Required Licenses

- **Power Automate**: Office 365 (included with most M365 plans)
- **SharePoint Online**: Included with M365
- **Power Apps**: Office 365 license (no premium connectors needed)

### Existing Infrastructure

- **Telemetry Flow**: You should already have a centralized telemetry flow configured (see [Telemetry.md](Telemetry.md))
- **Flow URL**: The HTTP trigger URL from your telemetry flow

---

## SharePoint List Setup

### Step 1: Create SharePoint Site (If Needed)

If you don't have a dedicated site for application management:

1. Navigate to SharePoint admin center or your organization's SharePoint
2. Create a new Communication Site or Team Site:
   - **Name**: "Application Management" (or similar)
   - **URL**: `https://yourdomain.sharepoint.com/sites/AppManagement`
   - **Privacy**: Private (recommended)

### Step 2: Create "App Feedback" List

1. Navigate to your SharePoint site
2. Click **"+ New"** → **"List"**
3. Choose **"Blank list"**
4. **Name**: `App Feedback`
5. **Description**: "User feedback submissions from all applications"
6. Click **"Create"**

### Step 3: Add Custom Columns

Delete the default "Title" column and recreate these columns:

#### Required Columns

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| **Title** | Single line of text | Yes | Max 255 chars, indexed |
| **App Name** | Choice | Yes | Choices: "Meeting Notes Generator", "Other App 1", etc. |
| **Feedback Type** | Choice | Yes | Choices: "Bug", "Feature", "Comment", "Performance", "Documentation" |
| **Priority** | Choice | Yes | Choices: "Critical", "High", "Medium", "Low" |
| **Description** | Multiple lines of text | Yes | Plain text, 6 lines visible |
| **Submitted By** | Person | Yes | Default to current user |
| **Submitted Date** | Date and Time | Yes | Include time, default to today |
| **Status** | Choice | Yes | Choices: "New", "In Review", "Planned", "Completed", "Won't Fix"<br>Default: "New" |
| **Assigned To** | Person | No | Allow blank |
| **Browser Context** | Multiple lines of text | No | Plain text, store JSON |
| **Page URL** | Hyperlink | No | URL format |
| **Error Logs** | Multiple lines of text | No | Plain text, store JSON |
| **Session ID** | Single line of text | No | For correlation with telemetry |

#### Detailed Column Configurations

**1. Title**
- Type: Single line of text
- Max length: 255
- Required: Yes
- Indexed: Yes (for performance)

**2. App Name**
- Type: Choice
- Choices:
  ```
  Meeting Notes Generator
  Staff Plan (if you have other apps)
  [Add other apps as needed]
  ```
- Required: Yes
- Default: "Meeting Notes Generator"

**3. Feedback Type**
- Type: Choice
- Choices:
  ```
  Bug
  Feature
  Comment
  Performance
  Documentation
  ```
- Required: Yes
- Allow fill-in: No

**4. Priority**
- Type: Choice
- Choices:
  ```
  Critical
  High
  Medium
  Low
  ```
- Required: Yes
- Default: "Medium"

**5. Description**
- Type: Multiple lines of text
- Text format: Plain text
- Number of lines: 6
- Required: Yes

**6. Submitted By**
- Type: Person or Group
- Allow multiple: No
- Required: Yes

**7. Submitted Date**
- Type: Date and Time
- Format: Date & Time
- Required: Yes
- Default: Today's date

**8. Status**
- Type: Choice
- Choices:
  ```
  New
  In Review
  Planned
  Completed
  Won't Fix
  ```
- Required: Yes
- Default: "New"

**9. Assigned To**
- Type: Person or Group
- Allow multiple: No
- Required: No

**10. Browser Context**
- Type: Multiple lines of text
- Text format: Plain text
- Number of lines: 10
- Required: No
- Description: "JSON object with browser, device, platform info"

**11. Page URL**
- Type: Hyperlink or Picture
- Format: Hyperlink
- Required: No

**12. Error Logs**
- Type: Multiple lines of text
- Text format: Plain text
- Number of lines: 10
- Required: No
- Description: "JSON array of console errors"

**13. Session ID**
- Type: Single line of text
- Max length: 100
- Required: No
- Description: "Telemetry session ID for correlation"

### Step 4: Create Default View

1. Click **"All items"** view → **"Edit current view"**
2. Configure columns to display:
   - Status
   - Title
   - Feedback Type
   - Priority
   - Submitted By
   - Submitted Date
   - Assigned To
3. Sort by: **Submitted Date** (descending)
4. Filter: **Status** is equal to **"New"** (default view shows only new feedback)
5. Save view as **"New Feedback"**

### Step 5: Create Additional Views

**In Review**
- Filter: Status = "In Review"
- Sort: Priority (descending), then Submitted Date (descending)

**My Assignments**
- Filter: Assigned To = [Me]
- Sort: Priority (descending), then Status

**All Feedback**
- No filter
- Sort: Submitted Date (descending)

**By App**
- Group by: App Name
- Sort: Submitted Date (descending)

---

## Power Automate Flow Configuration

### Step 1: Open Existing Telemetry Flow

1. Navigate to [Power Automate](https://make.powerautomate.com)
2. Find your existing **Centralized Telemetry Flow**
3. Click **"Edit"**

### Step 2: Add Condition After HTTP Trigger

1. After the **"When a HTTP request is received"** trigger
2. Click **"+ New step"**
3. Search for **"Condition"**
4. Configure condition:
   - **Left operand**: `triggerBody()?['eventType']`
   - **Operator**: `is equal to`
   - **Right operand**: `feedback`

### Step 3: Configure "If yes" Branch (Feedback Events)

1. In the **"If yes"** branch, click **"Add an action"**
2. Search for **"Parse JSON"**
3. Configure:
   - **Content**: `triggerBody()?['eventPayload']`
   - **Schema**: Use the schema below

#### Event Payload Schema

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
        "platform": { "type": "string" },
        "deviceType": { "type": "string" },
        "screenResolution": { "type": "string" },
        "theme": { "type": "string" }
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

### Step 4: Create SharePoint Item

1. After **"Parse JSON"**, click **"Add an action"**
2. Search for **"Create item"** (SharePoint)
3. Configure:
   - **Site Address**: Select your SharePoint site
   - **List Name**: Select "App Feedback"
   - **Title**: `body('Parse_JSON')?['title']`
   - **App Name**: `triggerBody()?['appName']`
   - **Feedback Type**: `body('Parse_JSON')?['feedbackType']`
   - **Priority**: `body('Parse_JSON')?['priority']`
   - **Description**: `body('Parse_JSON')?['description']`
   - **Submitted By**: `triggerBody()?['userContext']?['email']`
   - **Submitted Date**: `triggerBody()?['timestamp']`
   - **Status**: `New`
   - **Browser Context**: `string(body('Parse_JSON')?['browserContext'])`
   - **Page URL**: `body('Parse_JSON')?['url']`
   - **Error Logs**: `string(body('Parse_JSON')?['errorLogs'])`
   - **Session ID**: `triggerBody()?['sessionId']`

### Step 5: Configure "If no" Branch (Other Telemetry)

1. In the **"If no"** branch, add your existing telemetry logic
2. This is where you handle all other event types (userLogin, notesGenerated, etc.)
3. Example: Log to Excel, send to Application Insights, etc.

### Step 6: Save and Test Flow

1. Click **"Save"** in the top-right
2. Copy the **HTTP POST URL** from the trigger
3. Update `appConfig.ts` in your application if the URL changed
4. Test the flow (see [Testing](#testing-the-integration) section below)

### Full Flow Structure

```
When a HTTP request is received
  ↓
Parse JSON (eventPayload)
  ↓
Condition: eventType == "feedback"?
  ├─ If yes:
  │   ↓
  │  Parse JSON (feedback payload)
  │   ↓
  │  Create item (SharePoint: App Feedback)
  │   ↓
  │  [Optional] Send email notification to triage team
  │
  └─ If no:
      ↓
     [Your existing telemetry logic]
     (Log to Excel, Application Insights, etc.)
```

---

## Conditional Routing Logic

### Event Type Detection

The key to routing is checking the `eventType` field in the event envelope:

**Power Automate Expression**:
```
triggerBody()?['eventType']
```

**Possible Values**:
- `feedback` → Route to SharePoint list
- `userLogin` → Existing telemetry handling
- `notesGenerated` → Existing telemetry handling
- `exportedToCSV` → Existing telemetry handling
- [All other event types] → Existing telemetry handling

### Example Condition Configuration

**Condition Name**: "Is Feedback Event?"

**If yes**:
- Parse feedback payload
- Create SharePoint item
- [Optional] Send email notification

**If no**:
- Your existing telemetry logic
- Examples:
  - Add row to Excel table
  - Send to Application Insights
  - Log to another SharePoint list
  - No action (just acknowledge)

### Advanced: Multiple Conditions

If you want to route different feedback priorities differently:

```
Condition 1: eventType == "feedback"
  ├─ If yes:
  │   ↓
  │  Parse JSON (feedback payload)
  │   ↓
  │  Condition 2: priority == "Critical"
  │    ├─ If yes:
  │    │   ↓
  │    │  Create SharePoint item
  │    │   ↓
  │    │  Send urgent email to team
  │    │
  │    └─ If no:
  │        ↓
  │       Create SharePoint item
  │       (No email notification)
  │
  └─ If no:
      ↓
     [Existing telemetry logic]
```

---

## Power App for Triage

### Step 1: Create Canvas App

1. Navigate to [Power Apps](https://make.powerapps.com)
2. Click **"+ Create"**
3. Choose **"Canvas app from blank"**
4. **Name**: "App Feedback Triage"
5. **Format**: Tablet (landscape orientation)
6. Click **"Create"**

### Step 2: Connect to SharePoint List

1. In Power Apps Studio, click **"Data"** (left sidebar)
2. Click **"Add data"**
3. Search for **"SharePoint"**
4. Select your SharePoint site
5. Select **"App Feedback"** list
6. Click **"Connect"**

### Step 3: Build Gallery View

1. Click **"Insert"** → **"Gallery"** → **"Vertical"**
2. Set **Items**: `'App Feedback'`
3. Configure layout:
   - **Title**: `ThisItem.Title`
   - **Subtitle**: `ThisItem.'Feedback Type' & " - " & ThisItem.Priority`
   - **Body**: `"Submitted by " & ThisItem.'Submitted By'.DisplayName & " on " & Text(ThisItem.'Submitted Date', "mm/dd/yyyy")`

### Step 4: Add Filter Controls

**Status Filter**:
1. Insert **Dropdown** control
2. **Items**: `["All", "New", "In Review", "Planned", "Completed", "Won't Fix"]`
3. **Default**: `"New"`
4. Update gallery **Items**:
   ```
   Filter('App Feedback',
     If(Dropdown1.Selected.Value = "All", true, Status = Dropdown1.Selected.Value)
   )
   ```

**Priority Filter**:
1. Insert another **Dropdown**
2. **Items**: `["All", "Critical", "High", "Medium", "Low"]`
3. **Default**: `"All"`
4. Update gallery **Items** with additional filter

**Search Box**:
1. Insert **Text input** control
2. Update gallery **Items**:
   ```
   Filter('App Feedback',
     SearchInput.Text in Title || SearchInput.Text in Description
   )
   ```

### Step 5: Add Detail View

1. Insert **Form** control
2. **Data source**: `'App Feedback'`
3. **Item**: `Gallery1.Selected`
4. **Mode**: `FormMode.Edit`
5. Show fields:
   - Title (read-only)
   - App Name (read-only)
   - Feedback Type (read-only)
   - Priority (read-only)
   - Description (read-only)
   - Submitted By (read-only)
   - Submitted Date (read-only)
   - **Status** (editable dropdown)
   - **Assigned To** (editable people picker)
   - Page URL (read-only)
   - Browser Context (read-only, multiline)
   - Error Logs (read-only, multiline)

### Step 6: Add Save Button

1. Insert **Button** control
2. **Text**: "Save Changes"
3. **OnSelect**:
   ```
   SubmitForm(Form1);
   Notify("Feedback updated successfully", NotificationType.Success)
   ```

### Step 7: Style and Polish

**Colors**:
- Use your organization's brand colors
- Color-code priority:
  - Critical: Red background
  - High: Orange background
  - Medium: Yellow background
  - Low: Green background

**Status Icons**:
- Add icons to status dropdown:
  - New: 🆕
  - In Review: 👀
  - Planned: 📋
  - Completed: ✅
  - Won't Fix: ❌

### Step 8: Test and Publish

1. Click **"Play"** button (top-right) to test
2. Try filtering, searching, and updating status
3. Click **"File"** → **"Save"**
4. Click **"Publish"**
5. Share app with triage team members

### Optional Enhancements

**Email Integration**:
- Add button to send email to user who submitted feedback
- Pre-populate with feedback details

**Comments/Notes**:
- Add a "Notes" field to SharePoint list
- Add multiline text input in Power App for triage notes

**Metrics Dashboard**:
- Add screen with charts:
  - Feedback by type (pie chart)
  - Feedback by priority (bar chart)
  - Open vs closed (gauge)
  - Trend over time (line chart)

---

## Testing the Integration

### Step 1: Test Feedback Submission (Frontend)

1. Open Meeting Notes Generator in browser
2. Click the **Feedback** button (bottom-right)
3. Fill out the form:
   - **Type**: Bug
   - **Priority**: High
   - **Title**: "Test feedback submission"
   - **Description**: "Testing the feedback system end-to-end"
4. Click **"Submit Feedback"**
5. Verify success message appears
6. Check browser console for telemetry log: `📊 Telemetry Event: feedback`

### Step 2: Verify Power Automate Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Open your telemetry flow
3. Check **"Run history"** (28-day retention)
4. Find the most recent run
5. Click to view details
6. Verify:
   - ✅ Trigger succeeded
   - ✅ Condition evaluated to "true" (feedback event)
   - ✅ Parse JSON succeeded
   - ✅ Create item (SharePoint) succeeded

### Step 3: Verify SharePoint List

1. Navigate to your SharePoint site
2. Open **"App Feedback"** list
3. Check for new item:
   - **Title**: "Test feedback submission"
   - **App Name**: "Meeting Notes Generator"
   - **Feedback Type**: "Bug"
   - **Priority**: "High"
   - **Submitted By**: Your name/email
   - **Status**: "New"
   - **Browser Context**: JSON with browser info
   - **Page URL**: Current page URL
   - **Error Logs**: (may be empty if no errors)

### Step 4: Test Power App

1. Open **"App Feedback Triage"** Power App
2. Verify test feedback appears in gallery
3. Click on the test feedback item
4. Change **Status** to "In Review"
5. Assign to yourself
6. Click **"Save Changes"**
7. Verify update succeeded in SharePoint list

### Step 5: Test Edge Cases

**Empty Error Logs**:
- Submit feedback when console has no errors
- Verify `errorLogs` field is null or empty

**With Error Logs**:
- Open browser console
- Run: `console.error("Test error for feedback")`
- Submit feedback
- Verify error appears in `errorLogs` field

**Multi-Language**:
- Change app language to Spanish
- Submit feedback in Spanish
- Verify it appears correctly in SharePoint

**Different Priorities**:
- Submit feedback with each priority level
- Verify conditional routing (if configured)

---

## Troubleshooting

### Issue: Flow Run Fails

**Symptom**: Power Automate flow shows failed run

**Possible Causes**:
1. **SharePoint permissions**: Flow owner doesn't have edit permissions on list
2. **Schema mismatch**: eventPayload structure doesn't match Parse JSON schema
3. **Missing required fields**: SharePoint list has required fields not being populated

**Solution**:
1. Check flow run history for specific error message
2. Verify SharePoint permissions (flow owner needs Edit permissions)
3. Update Parse JSON schema to match actual payload
4. Ensure all required SharePoint columns have values in Create Item action

### Issue: Feedback Not Appearing in SharePoint

**Symptom**: Flow succeeds but no item created in SharePoint

**Possible Causes**:
1. Wrong SharePoint site or list selected
2. Condition not evaluating correctly (eventType != "feedback")

**Solution**:
1. Verify Site Address and List Name in Create Item action
2. Check condition configuration: `triggerBody()?['eventType']` == `feedback`
3. Test with manual trigger and sample payload

### Issue: Browser Context or Error Logs Not Saving

**Symptom**: Item created but Browser Context or Error Logs columns are empty

**Possible Causes**:
1. JSON stringification not working
2. Column type incorrect (should be Multiple lines of text)

**Solution**:
1. Use `string()` function: `string(body('Parse_JSON')?['browserContext'])`
2. Verify SharePoint column is "Multiple lines of text" (not "Single line")
3. Check browser console for errors in frontend

### Issue: Power App Not Showing Data

**Symptom**: Power App opens but gallery is empty

**Possible Causes**:
1. SharePoint connection not established
2. Filter too restrictive (e.g., Status = "New" but all items are "Completed")
3. Permissions issue (user doesn't have read access to list)

**Solution**:
1. Reconnect to SharePoint in Power Apps Studio
2. Set filter dropdown to "All"
3. Verify user has at least Read permissions on SharePoint list
4. Check formula bar for errors (red underlines)

### Issue: Telemetry Flow URL Not Working

**Symptom**: Feedback submission shows success but nothing happens

**Possible Causes**:
1. Flow URL not configured in `appConfig.ts`
2. CORS issue (unlikely with Power Automate)
3. Flow disabled or deleted

**Solution**:
1. Verify `telemetryFlowUrl` in `appConfig.ts` is correct HTTP POST URL
2. Check browser network tab for 200 or 202 response
3. Verify flow is enabled in Power Automate
4. Check browser console for fetch errors

### Issue: Critical Feedback Not Triggering Alerts

**Symptom**: Critical priority feedback submitted but no notification

**Possible Causes**:
1. Email notification not configured in flow
2. Priority value mismatch (e.g., "critical" vs "Critical")

**Solution**:
1. Add "Send an email" action after Create Item for critical feedback
2. Ensure priority values match exactly (case-sensitive)
3. Add condition: `body('Parse_JSON')?['priority']` == `Critical`

---

## Maintenance

### Regular Tasks

**Weekly**:
- ✅ Review new feedback items
- ✅ Assign feedback to appropriate team members
- ✅ Update status for feedback in progress

**Monthly**:
- ✅ Close completed feedback items
- ✅ Archive old feedback (> 90 days)
- ✅ Review feedback metrics (types, priorities, trends)

**Quarterly**:
- ✅ Analyze feedback patterns
- ✅ Identify recurring issues
- ✅ Update app based on feedback themes
- ✅ Clean up SharePoint list (delete test items)

### Monitoring Flow Health

1. Set up **Flow Checker** alerts in Power Automate
2. Enable **Email notifications** for flow failures
3. Check flow run history weekly for errors

**Key Metrics to Track**:
- Flow run success rate (target: >99%)
- Average flow execution time
- Number of feedback items per week
- Feedback resolution time (submission to completion)

### Scaling to Multiple Apps

When you add more applications:

1. **Update App Name Choices**:
   - Edit SharePoint "App Name" column
   - Add new application name to choices

2. **Update Power App**:
   - Add filter by App Name
   - Color-code by app in gallery view

3. **Update Conditional Routing** (optional):
   - Route different apps to different lists
   - Route different apps to different email recipients

**Example Multi-App Routing**:
```
Condition 1: eventType == "feedback"
  ├─ If yes:
  │   ↓
  │  Parse JSON (feedback payload)
  │   ↓
  │  Switch (appName)
  │    ├─ Case "Meeting Notes Generator":
  │    │   ↓
  │    │  Create item in "App Feedback" list
  │    │
  │    ├─ Case "Staff Plan":
  │    │   ↓
  │    │  Create item in "Staff Plan Feedback" list
  │    │
  │    └─ Default:
  │        ↓
  │       Create item in "App Feedback" list
  │
  └─ If no:
      ↓
     [Existing telemetry logic]
```

### Backing Up Data

**SharePoint List Export**:
1. Open "App Feedback" list
2. Click **"Export to Excel"**
3. Save file with timestamp
4. Store in secure location

**Power Automate Flow Export**:
1. Open flow in Power Automate
2. Click **"Export"** → **"Package (.zip)"**
3. Save with timestamp
4. Store in secure location

**Power App Export**:
1. Open app in Power Apps Studio
2. Click **"File"** → **"Save as"**
3. Click **"Download a copy"**
4. Store .msapp file securely

---

## Appendix: Sample Feedback Payload

### Full Event Envelope (Sent to Power Automate)

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.2.0",
  "sessionId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "correlationId": "",
  "eventType": "feedback",
  "timestamp": "2025-10-23T14:30:00.000Z",
  "userContext": {
    "name": "John Doe",
    "email": "john.doe@company.com",
    "tenantId": "abc123-def456-ghi789"
  },
  "eventPayload": "{\"feedbackType\":\"bug\",\"priority\":\"high\",\"title\":\"Export to CSV fails with special characters\",\"description\":\"When I try to export action items that contain special characters like é or ñ, the CSV download fails with an error.\",\"browserContext\":{\"browser\":\"Chrome\",\"browserVersion\":\"120.0.0.0\",\"platform\":\"Windows\",\"platformVersion\":\"10/11\",\"deviceType\":\"desktop\",\"screenResolution\":\"1920x1080\",\"theme\":\"dark\"},\"url\":\"http://localhost:5173/\",\"page\":\"/\",\"errorLogs\":{\"hasErrors\":true,\"errorCount\":2,\"warningCount\":1,\"recentErrors\":[\"TypeError: Cannot read property 'split' of undefined at exportToCSV (export.ts:45)\",\"Warning: Failed to download file\"]}}"
}
```

### Parsed Event Payload (After Parse JSON)

```json
{
  "feedbackType": "bug",
  "priority": "high",
  "title": "Export to CSV fails with special characters",
  "description": "When I try to export action items that contain special characters like é or ñ, the CSV download fails with an error.",
  "browserContext": {
    "browser": "Chrome",
    "browserVersion": "120.0.0.0",
    "platform": "Windows",
    "platformVersion": "10/11",
    "deviceType": "desktop",
    "screenResolution": "1920x1080",
    "viewportSize": "1920x937",
    "devicePixelRatio": 1,
    "orientation": "landscape",
    "isFullscreen": false,
    "touchSupported": false,
    "maxTouchPoints": 0,
    "language": "en-US",
    "languages": ["en-US", "en"],
    "timezone": "America/New_York",
    "timezoneOffset": 300,
    "theme": "dark",
    "connectionType": "wifi",
    "connectionEffectiveType": "4g",
    "connectionDownlink": 10,
    "connectionRtt": 50,
    "cookiesEnabled": true,
    "localStorageAvailable": true,
    "sessionStorageAvailable": true,
    "webWorkersSupported": true,
    "serviceWorkerSupported": true,
    "hardwareConcurrency": 8,
    "deviceMemory": 8
  },
  "url": "http://localhost:5173/",
  "page": "/",
  "errorLogs": {
    "hasErrors": true,
    "errorCount": 2,
    "warningCount": 1,
    "recentErrors": [
      "TypeError: Cannot read property 'split' of undefined at exportToCSV (export.ts:45)",
      "Warning: Failed to download file"
    ]
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial release - Complete setup guide for feedback system |

---

**For additional support, contact the IPCT team or your Power Platform administrator.**
