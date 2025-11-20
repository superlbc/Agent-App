# Freeze Period - Power Automate Integration Guide

## Overview

This guide explains how to set up Power Automate flows to enable automated email generation for freeze period notifications. The system supports two modes:

1. **Button-Triggered Mode** (Recommended for initial setup)
   - HR reviews pending notifications in the dashboard
   - Clicks "Generate Email" button to create email
   - Power Automate flow sends email to Helix
   - HR retains full control over when emails are sent

2. **Fully Automated Mode** (Optional advanced setup)
   - Power Automate runs on a daily schedule (e.g., 6 AM)
   - Checks for notifications with actionDate = today
   - Automatically sends emails to Helix
   - CC's HR team (Camille/Payton) for visibility

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Employee Onboarding System (React App)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FreezePeriodDashboard Component                           │ │
│  │  - Displays pending notifications                          │ │
│  │  - "Generate Email" button clicked                         │ │
│  │  - Builds email payload with template data                 │ │
│  └────────────────┬───────────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ HTTPS POST
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Power Automate Flow: "Freeze Period - Send Email"             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Trigger: HTTP Request (manual)                            │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │  Input Schema:                                              │ │
│  │  {                                                          │ │
│  │    "to": "helix@momentumww.com",                            │ │
│  │    "cc": ["camille@momentumww.com", "payton@momentumww.com"],│ │
│  │    "subject": "Password Reset Required - ...",             │ │
│  │    "body": "Dear IT Team, ...",                            │ │
│  │    "notificationId": "notif-123",                          │ │
│  │    "employeeId": "emp-456"                                 │ │
│  │  }                                                          │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Action 1: Send Email via Office 365 Outlook               │ │
│  │  - To: @{triggerBody()?['to']}                             │ │
│  │  - CC: @{join(triggerBody()?['cc'], ';')}                  │ │
│  │  - Subject: @{triggerBody()?['subject']}                   │ │
│  │  - Body: @{triggerBody()?['body']}                         │ │
│  │  - Importance: High                                        │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Action 2: Update Notification Status (HTTP POST)          │ │
│  │  - URL: {appUrl}/api/notifications/{notificationId}/sent   │ │
│  │  - Method: POST                                            │ │
│  │  - Body: { "sentBy": "Power Automate", "sentDate": "..." }│ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Action 3: Return Success Response                         │ │
│  │  - Status Code: 200                                        │ │
│  │  - Body: { "success": true, "emailSent": true }            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Helix Ticketing System                                         │
│  - Receives email with password reset/termination request      │
│  - IT team processes request                                   │
│  - Updates ticket status when complete                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Create Power Automate Flow (Button-Triggered Mode)

1. **Go to Power Automate** (https://make.powerautomate.com)
2. **Create a new flow** → "Instant cloud flow"
3. **Name**: "Freeze Period - Send Email (Button-Triggered)"
4. **Trigger**: "When an HTTP request is received"

### Step 2: Configure HTTP Request Trigger

**Request Body JSON Schema**:
```json
{
  "type": "object",
  "properties": {
    "to": {
      "type": "string",
      "description": "Recipient email address (Helix)"
    },
    "cc": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "CC recipients (HR team)"
    },
    "subject": {
      "type": "string",
      "description": "Email subject line"
    },
    "body": {
      "type": "string",
      "description": "Email body content"
    },
    "notificationId": {
      "type": "string",
      "description": "Notification record ID"
    },
    "employeeId": {
      "type": "string",
      "description": "Employee record ID"
    },
    "actionType": {
      "type": "string",
      "description": "start or end"
    }
  },
  "required": ["to", "subject", "body", "notificationId"]
}
```

### Step 3: Add "Send Email" Action

1. **Click "+ New step"**
2. **Search for**: "Send an email (V2)" (Office 365 Outlook)
3. **Configure**:
   - **To**: `@{triggerBody()?['to']}`
   - **CC**: `@{join(triggerBody()?['cc'], ';')}`
   - **Subject**: `@{triggerBody()?['subject']}`
   - **Body**: `@{triggerBody()?['body']}`
   - **Importance**: High

### Step 4: Add "Update Notification Status" Action (Optional)

If you have a backend API to track sent status:

1. **Click "+ New step"**
2. **Search for**: "HTTP"
3. **Configure**:
   - **Method**: POST
   - **URI**: `https://your-app.com/api/notifications/@{triggerBody()?['notificationId']}/sent`
   - **Headers**: `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "sentBy": "Power Automate",
       "sentDate": "@{utcNow()}",
       "emailSent": true
     }
     ```

### Step 5: Add "Return Response" Action

1. **Click "+ New step"**
2. **Search for**: "Response" (Request)
3. **Configure**:
   - **Status Code**: 200
   - **Body**:
     ```json
     {
       "success": true,
       "emailSent": true,
       "notificationId": "@{triggerBody()?['notificationId']}"
     }
     ```

### Step 6: Save and Get Flow URL

1. **Save the flow**
2. **Copy the "HTTP POST URL"** from the trigger
3. **Add this URL to your app configuration**:
   ```typescript
   // appConfig.ts
   export const appConfig = {
     freezePeriodEmailFlowUrl: "https://prod-xx.eastus.logic.azure.com:443/workflows/xxx/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xxx"
   };
   ```

---

## Frontend Integration

### Update `FreezePeriodDashboard.tsx`

Add function to call Power Automate flow:

```typescript
const handleGenerateSingleEmail = async (notification: FreezePeriodNotification) => {
  const freezePeriod = getActiveFreezePeriod(notification.actionDate, activePeriods);
  if (!freezePeriod) {
    alert('No active freeze period found for this date');
    return;
  }

  let emailTemplate;
  if (notification.actionType === 'start') {
    const preHire = preHires.find((ph) => ph.id === notification.employeeId);
    if (!preHire) return;
    emailTemplate = generateStartDateEmail(preHire, freezePeriod);
  } else {
    const employee = employees.find((emp) => emp.id === notification.employeeId);
    if (!employee) return;
    emailTemplate = generateEndDateEmail(employee, freezePeriod);
  }

  // Call Power Automate flow
  try {
    const response = await fetch(appConfig.freezePeriodEmailFlowUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailTemplate.to,
        cc: emailTemplate.cc,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        notificationId: notification.id,
        employeeId: notification.employeeId,
        actionType: notification.actionType,
      }),
    });

    if (response.ok) {
      alert('Email sent successfully!');
      onMarkEmailSent(notification.id);
    } else {
      alert('Failed to send email. Please try again.');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('Error sending email. Please check your connection.');
  }
};
```

---

## Automated Mode Setup (Optional)

### Daily Scheduled Flow

For fully automated email sending:

1. **Create a new flow**: "Scheduled cloud flow"
2. **Name**: "Freeze Period - Daily Email Automation"
3. **Trigger**: "Recurrence"
   - **Interval**: 1
   - **Frequency**: Day
   - **Start time**: 6:00 AM
   - **Time zone**: Your time zone

4. **Action 1**: "Get Pending Notifications" (HTTP GET)
   - **URI**: `https://your-app.com/api/freeze-periods/notifications/pending-today`
   - **Method**: GET
   - **Returns**: Array of notifications with actionDate = today

5. **Action 2**: "Apply to each" (loop through notifications)
   - **Input**: `@{body('Get_Pending_Notifications')}`

6. **Inside loop**:
   - **Send Email** (same as button-triggered mode)
   - **Update Notification Status** (mark as sent)

7. **After loop**: Send summary email to HR team
   - **To**: camille@momentumww.com, payton@momentumww.com
   - **Subject**: "Freeze Period Daily Summary - {today's date}"
   - **Body**: "{X} emails sent automatically"

---

## Testing

### Test Button-Triggered Mode

1. **In FreezePeriodDashboard**:
   - Create a test freeze period (today to tomorrow)
   - Create a test pre-hire with start date = today
   - Click "Generate Email" button

2. **Expected Result**:
   - Email appears in Helix inbox
   - HR team (CC) receives copy
   - Notification status changes to "sent"

### Test Automated Mode

1. **Manual Run**:
   - Go to Power Automate flow
   - Click "Test" → "Manually"
   - Verify emails sent correctly

2. **Scheduled Run**:
   - Wait for scheduled time (6 AM)
   - Check Helix inbox
   - Check HR summary email

---

## Troubleshooting

### Issue: Email not sending

**Check**:
1. Power Automate flow run history (any errors?)
2. Flow URL configured correctly in appConfig.ts
3. Office 365 Outlook connector authenticated
4. Recipient email addresses valid

### Issue: Notification status not updating

**Check**:
1. Backend API endpoint exists and accessible
2. Authentication headers included in HTTP request
3. Response status code (should be 200)

### Issue: CC recipients not receiving email

**Check**:
1. CC array joined correctly: `@{join(triggerBody()?['cc'], ';')}`
2. Email addresses separated by semicolon
3. Office 365 Outlook connector has "Send on behalf of" permission

---

## Best Practices

1. **Start with Button-Triggered Mode**: Test thoroughly before enabling automation
2. **Monitor Flow Runs**: Check Power Automate run history daily for first week
3. **Set Up Alerts**: Configure flow failure alerts to your email
4. **Test Templates**: Send test emails to your own inbox first
5. **Document Helix Process**: Ensure IT team knows to expect automated emails
6. **Track Metrics**: Monitor email send success rate, response times
7. **Backup Plan**: Have manual process documented in case automation fails

---

## Security Considerations

1. **Flow URL Protection**: Treat Power Automate flow URL as a secret (don't commit to git)
2. **Access Control**: Only HR team should have access to flow editing
3. **Audit Trail**: Power Automate maintains run history for 28 days
4. **Data Privacy**: Email content contains employee PII - ensure compliance
5. **Rate Limiting**: Office 365 Outlook has sending limits (check your tenant settings)

---

## Next Steps

1. **Set up Button-Triggered flow** (recommended first step)
2. **Test with sample data** (create test freeze period and pre-hire)
3. **Train HR team** on dashboard usage and email generation
4. **Monitor for 1-2 weeks** before enabling automation
5. **Consider Automated Mode** if email volume is high (>10/day)

---

## Support

For questions or issues:
- **Power Automate**: IT Admin / Power Platform team
- **Application**: Development team
- **Helix Integration**: Chris Kumar (McCarthy)
