# Power Automate Email Template - Quick Reference Guide

> **Purpose**: Best practices for creating email templates in Power Automate that reference telemetry event data
> **Last Updated**: 2025-10-29
> **Version**: 1.0

---

## Overview

This guide provides best practices and quick references for creating email templates in Power Automate flows that process telemetry events from the Meeting Notes Generator and similar applications.

---

## Event Envelope Structure

### What the HTTP Trigger Receives

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.0.0",
  "sessionId": "UUID",
  "correlationId": "",
  "eventType": "feedback",
  "timestamp": "2025-10-29T...",
  "userContext": {
    "name": "User Name",
    "email": "user@company.com",
    "tenantId": "tenant-id"
  },
  "eventPayload": "{...json string...}"
}
```

**Key Points:**
- Top-level fields are **objects** - access directly via `triggerBody()?['field']`
- `eventPayload` is a **JSON STRING** - needs Parse JSON action
- Once parsed, nested objects are **objects** - access directly via `body('action')?['nested']?['field']`

---

## Reference Patterns

### ✅ Correct Patterns

| Data Location | Correct Reference | Why |
|--------------|-------------------|-----|
| **Envelope fields** | `triggerBody()?['userContext']?['name']` | Direct access to HTTP trigger body |
| **Envelope timestamp** | `triggerBody()?['timestamp']` | Direct access to HTTP trigger body |
| **Event type** | `triggerBody()?['eventType']` | Direct access to HTTP trigger body |
| **Parsed payload** | `body('Parse_JSON_Payload')?['feedbackType']` | Access parsed eventPayload string |
| **Nested objects** | `body('Parse_JSON_Payload')?['browserContext']?['browser']` | Direct access to nested object |

### ❌ Common Mistakes

| Wrong Pattern | Problem | Correct Alternative |
|--------------|---------|---------------------|
| `body('Parse_JSON_Main')?['userContext']?['name']` | Unnecessary Parse JSON action | `triggerBody()?['userContext']?['name']` |
| `body('Parse_JSON_BrowserContext')?['browser']` | Treating object as JSON string | `body('Parse_JSON_Payload')?['browserContext']?['browser']` |
| `body('Parse_JSON_ErrorLogs')?['errorCount']` | Treating object as JSON string | `body('Parse_JSON_Payload')?['errorLogs']?['errorCount']` |

---

## Parse JSON Decision Tree

```
Is the field a JSON STRING?
├─ Yes → Create Parse JSON action
│   Examples:
│   • triggerBody()?['eventPayload'] = "{...json...}"
│   • Response body from API = "{...json...}"
│
└─ No (it's already an object) → Access directly
    Examples:
    • triggerBody()?['userContext'] = {...object...}
    • body('ParsedAction')?['browserContext'] = {...object...}
```

---

## Minimal Flow Structure for Feedback Emails

```
When HTTP request is received
  ↓
Condition: triggerBody()?['eventType'] == "feedback"
  ↓ (If yes)
Parse JSON - Feedback Payload
  Content: triggerBody()?['eventPayload']
  Schema: [Feedback payload schema]
  ↓
Compose - Email Template
  [HTML with corrected references]
  ↓
Send an email (V2)
  Body: outputs('Compose')
```

**Total Parse JSON actions needed: 1** (just for the eventPayload string)

---

## Email Template Reference Cheat Sheet

### User Information (from envelope)

```html
<!-- User Name -->
@{triggerBody()?['userContext']?['name']}

<!-- User Email -->
@{triggerBody()?['userContext']?['email']}

<!-- Timestamp -->
@{formatDateTime(triggerBody()?['timestamp'], 'dddd, MMMM dd, yyyy')}

<!-- Session ID -->
@{triggerBody()?['sessionId']}

<!-- App Name -->
@{triggerBody()?['appName']}
```

### Feedback Fields (from parsed eventPayload)

```html
<!-- Feedback Type -->
@{body('Parse_JSON_-_Feedback_Payload')?['feedbackType']}

<!-- Priority -->
@{body('Parse_JSON_-_Feedback_Payload')?['priority']}

<!-- Title -->
@{body('Parse_JSON_-_Feedback_Payload')?['title']}

<!-- Description -->
@{body('Parse_JSON_-_Feedback_Payload')?['description']}

<!-- Page URL -->
@{body('Parse_JSON_-_Feedback_Payload')?['url']}

<!-- Page Route -->
@{body('Parse_JSON_-_Feedback_Payload')?['page']}
```

### Browser Context (nested object in parsed payload)

```html
<!-- Browser Name -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['browser']}

<!-- Browser Version -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['browserVersion']}

<!-- Platform -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['platform']}

<!-- Device Type -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['deviceType']}

<!-- Screen Resolution -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['screenResolution']}

<!-- Theme -->
@{body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['theme']}
```

### Error Logs (nested object in parsed payload)

```html
<!-- Has Errors? -->
@{body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['hasErrors']}

<!-- Error Count -->
@{body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['errorCount']}

<!-- Warning Count -->
@{body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['warningCount']}

<!-- Recent Errors Array -->
@{body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['recentErrors']}
```

---

## Common Power Automate Expressions

### Capitalization

```html
<!-- Capitalize first letter -->
@{toUpper(substring(body('Parse_JSON_-_Feedback_Payload')?['feedbackType'], 0, 1))}@{substring(body('Parse_JSON_-_Feedback_Payload')?['feedbackType'], 1, sub(length(body('Parse_JSON_-_Feedback_Payload')?['feedbackType']), 1))}
```

### Conditional Display

```html
<!-- Show content only if condition is true -->
@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['hasErrors'], true), 'Error section content', '')}
```

### Boolean Display

```html
<!-- Show checkmark if true, X if false -->
@{if(equals(body('Parse_JSON_-_Feedback_Payload')?['browserContext']?['cookiesEnabled'], true), '✓', '✗')}
```

### Array Iteration

```html
<!-- Loop through array and display items -->
@{join(
  select(body('Parse_JSON_-_Feedback_Payload')?['errorLogs']?['recentErrors'],
    concat('<div class="error-item">', item(), '</div>')
  ), ''
)}
```

### Date Formatting

```html
<!-- Format date -->
@{formatDateTime(triggerBody()?['timestamp'], 'dddd, MMMM dd, yyyy')}

<!-- Format time -->
@{formatDateTime(triggerBody()?['timestamp'], 'HH:mm:ss')}

<!-- Custom format -->
@{formatDateTime(triggerBody()?['timestamp'], 'yyyy-MM-dd HH:mm:ss')}
```

---

## Testing Your Template

### Step 1: Use Flow Tester

1. Click **"Test"** in Power Automate designer
2. Select **"Manually"**
3. Paste a sample payload (see below)
4. Click **"Test Flow"**
5. Verify all fields populate correctly

### Step 2: Sample Test Payload

```json
{
  "appName": "Meeting Notes Generator",
  "appVersion": "1.0.0",
  "sessionId": "test-session-123",
  "correlationId": "",
  "eventType": "feedback",
  "timestamp": "2025-10-29T14:30:00.000Z",
  "userContext": {
    "name": "Test User",
    "email": "test.user@company.com",
    "tenantId": "test-tenant-id"
  },
  "eventPayload": "{\"feedbackType\":\"bug\",\"priority\":\"high\",\"title\":\"Test feedback\",\"description\":\"This is a test\",\"browserContext\":{\"browser\":\"Chrome\",\"browserVersion\":\"120.0\",\"platform\":\"Windows\",\"deviceType\":\"desktop\",\"screenResolution\":\"1920x1080\",\"theme\":\"dark\",\"cookiesEnabled\":true,\"localStorageAvailable\":true},\"url\":\"https://test.app.com\",\"page\":\"/\",\"errorLogs\":{\"hasErrors\":true,\"errorCount\":2,\"warningCount\":1,\"recentErrors\":[\"Error 1\",\"Error 2\"]}}"
}
```

### Step 3: Verify Output

Check that the email shows:
- ✓ User name: "Test User"
- ✓ User email: "test.user@company.com"
- ✓ Feedback type: "Bug"
- ✓ Priority badge: "High"
- ✓ Browser: "Chrome"
- ✓ Error count: "2"
- ✓ No missing fields or "null" values

---

## Troubleshooting

### Template Expression Error

**Error**: `The template language expression '...' cannot be evaluated`

**Solution**:
1. Check action name matches reference (case-sensitive)
2. Verify Parse JSON action completed successfully
3. Check field exists in schema
4. Use optional chaining: `?['field']`

### Missing Data in Email

**Error**: Fields show as blank or "null"

**Solution**:
1. Verify Parse JSON schema includes all fields
2. Check sample payload has data for that field
3. Test with manual trigger and sample data
4. Use expressions pane to test references

### Array Not Displaying

**Error**: Array shows as "[object Object]"

**Solution**:
1. Use `join()` and `select()` to iterate array
2. Don't stringify objects - access fields directly
3. Example: `@{join(select(array, concat('<li>', item(), '</li>')), '')}`

---

## Best Practices

### 1. Minimize Parse JSON Actions

**Only parse JSON STRINGS**, not objects.

```
✓ Good: One Parse JSON for eventPayload string
✗ Bad: Separate Parse JSON for each nested object
```

### 2. Use Optional Chaining

**Always use `?['field']` syntax** to handle missing fields gracefully.

```html
✓ Good: @{triggerBody()?['userContext']?['name']}
✗ Bad: @{triggerBody()['userContext']['name']}
```

### 3. Test Incrementally

**Build template step-by-step:**
1. Start with basic fields (user name, timestamp)
2. Add feedback fields
3. Add browser context
4. Add conditional sections (error logs)
5. Test after each addition

### 4. Document Your Actions

**Add descriptions to Parse JSON actions:**
- "Parse eventPayload string into feedback object"
- Include schema version or date
- Note any special handling

### 5. Keep Schema Updated

When frontend payload structure changes:
1. Update Parse JSON schema
2. Test with new sample payload
3. Update email template if needed
4. Document changes in flow

---

## Quick Reference Card

**Print and keep near your workspace:**

```
╔═══════════════════════════════════════════════════════════════╗
║         POWER AUTOMATE EMAIL TEMPLATE QUICK REF               ║
╠═══════════════════════════════════════════════════════════════╣
║ Envelope (HTTP Trigger):                                     ║
║   triggerBody()?['userContext']?['name']                     ║
║   triggerBody()?['timestamp']                                 ║
║   triggerBody()?['sessionId']                                 ║
║                                                               ║
║ Parsed Payload (Parse JSON):                                 ║
║   body('Parse_JSON')?['feedbackType']                        ║
║   body('Parse_JSON')?['priority']                            ║
║                                                               ║
║ Nested Objects (Direct Access):                              ║
║   body('Parse_JSON')?['browserContext']?['browser']          ║
║   body('Parse_JSON')?['errorLogs']?['errorCount']            ║
║                                                               ║
║ Parse JSON Actions Needed: 1 (eventPayload only)             ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Additional Resources

- [POWER-AUTOMATE-FEEDBACK-FIX.md](POWER-AUTOMATE-FEEDBACK-FIX.md) - Comprehensive fix guide
- [FEEDBACK-SETUP.md](FEEDBACK-SETUP.md) - Complete setup documentation
- [telemetry.md](telemetry.md) - Telemetry event structure reference
- [Power Automate Expressions](https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference) - Microsoft documentation

---

**Questions or Issues?**

Contact: IPCT Team
Email: luis.bustos@momentumww.com
