# Power Automate Department Lookup - Configuration Fix

> **Status**: Action Required - Response Configuration Error
> **Impact**: Flow fails with 504 timeout due to Response action template error
> **Resolution Time**: 2 minutes

---

## 🔴 Current Issue

Your Power Automate flow has an **InvalidTemplate** error in the Response action:

```
Unable to process template language expressions in action 'Response' inputs at line '0' and column '0':
'The template language function 'length' expects its parameter to be an array or a string.
The provided value is of type 'Object'.'
```

**Good News**: The SQL query works perfectly (0.5 seconds execution time shown)!

**Bad News**: The Response action is misconfigured and prevents data from being returned.

---

## ✅ Step-by-Step Fix

### Step 1: Open Power Automate Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Open your flow: **momentum-department-lookup** (or whatever you named it)
3. Click **Edit**

### Step 2: Identify Your SQL Action Type

Click on your **"Execute SQL Query"** action and check the exact name:

- **Option A**: "Get rows (V2)" or "List rows present in a table"
- **Option B**: "Execute a SQL query"

### Step 3: Fix the Response Action

Click on the **Response** action at the bottom of your flow.

#### If you have "Get rows (V2)" (Option A):

**Delete the current Body** and paste this exact code:

```json
{
  "success": true,
  "timestamp": "@{utcNow()}",
  "recordCount": @{length(body('Execute_SQL_Query')?['value'])},
  "users": @{body('Execute_SQL_Query')?['value']}
}
```

**Important Notes**:
- Replace `'Execute_SQL_Query'` with your actual SQL action name if different
- Do NOT add quotes around `@{...}` expressions
- The `?['value']` is critical - SQL actions return `{value: [array]}`

#### If you have "Execute a SQL query" (Option B):

**Delete the current Body** and paste this:

```json
{
  "success": true,
  "timestamp": "@{utcNow()}",
  "recordCount": @{length(body('Execute_SQL_Query')['resultsets']?['Table1'])},
  "users": @{body('Execute_SQL_Query')['resultsets']?['Table1']}
}
```

### Step 4: Verify Response Settings

Make sure these settings are correct:

- **Status Code**: `200`
- **Headers**:
  - Name: `Content-Type`
  - Value: `application/json`

### Step 5: Save and Test

1. Click **Save** (top right)
2. Click **Test** → **Manually**
3. Click **Run flow**
4. Wait for flow to complete (~1-2 seconds)
5. Check **Run history** for success

---

## 🧪 Testing the Fixed Flow

After saving, run this test from your command line:

```bash
cd "c:\Users\luis.bustos\Downloads\Momo Mettings App"
node test-department-flow.js
```

**Expected Output** (should complete in ~1-2 seconds):

```
✅ SUCCESS - Flow responded successfully!

📋 Response Structure:
   - success: true
   - timestamp: 2025-10-30T...
   - recordCount: 1047
   - users: Array
   - users.length: 1047

👤 Sample User Record (first entry):
{
  "EmailAddress": "james.gavigan@momentumww.com",
  "Name": "James Gavigan",
  "DepartmentGroup": "Experience Production (XP)",
  "Department": "Production: XP",
  "GradeGroup": "XP - Directors",
  "RoleWithoutNumbers": "Group Experience Production, Director, VP"
}

✅ All expected fields present
```

---

## 📊 Understanding the Response Structure

### What the SQL Action Returns:

**SQL "Get rows (V2)" returns**:
```json
{
  "value": [
    { "EmailAddress": "...", "Name": "...", ... },
    { "EmailAddress": "...", "Name": "...", ... }
  ]
}
```

**SQL "Execute query" returns**:
```json
{
  "resultsets": {
    "Table1": [
      { "EmailAddress": "...", "Name": "...", ... }
    ]
  }
}
```

### What We Need to Return:

```json
{
  "success": true,
  "timestamp": "2025-10-30T16:53:43Z",
  "recordCount": 1047,
  "users": [
    { "EmailAddress": "...", "Name": "...", ... },
    ...
  ]
}
```

---

## 🔧 Common Mistakes to Avoid

### ❌ WRONG:

```json
{
  "users": @{Body}
}
```
**Problem**: Returns the object wrapper, not the array.

### ❌ WRONG:

```json
{
  "recordCount": "@{length(body('Execute_SQL_Query'))}"
}
```
**Problem**: Added quotes around expression (makes it a string, not evaluated).

### ❌ WRONG:

```json
{
  "users": @{body('Execute_SQL_Query')}
}
```
**Problem**: Missing `?['value']` - returns object instead of array.

### ✅ CORRECT:

```json
{
  "success": true,
  "timestamp": "@{utcNow()}",
  "recordCount": @{length(body('Execute_SQL_Query')?['value'])},
  "users": @{body('Execute_SQL_Query')?['value']}
}
```

---

## 📝 Sample Data Validation

Based on your SQL sample data, here's what the app will receive:

### User with Full Data:
```json
{
  "EmailAddress": "james.gavigan@momentumww.com",
  "Name": "James Gavigan",
  "DepartmentGroup": "Experience Production (XP)",
  "Department": "Production: XP",
  "GradeGroup": "XP - Directors",
  "RoleWithoutNumbers": "Group Experience Production, Director, VP"
}
```

**App Behavior**:
- Primary field used: `DepartmentGroup` ("Experience Production (XP)")
- Fallback if null: `Department` → Graph API → "Unknown"

### User with Null Department Fields:
```json
{
  "EmailAddress": "user@momentumww.com",
  "Name": "John Doe",
  "DepartmentGroup": null,
  "Department": null,
  "GradeGroup": null,
  "RoleWithoutNumbers": null
}
```

**App Behavior**:
- Will fall back to **Graph API department** field from Azure AD
- If Graph API also null → Shows "Unknown"
- User still identified as Momentum employee

---

## 🎯 Priority Order for Department Display

The application uses this priority for displaying department:

1. **Momentum `DepartmentGroup`** (preferred)
   - Example: "Experience Production (XP)"
   - Example: "Business Leadership"

2. **Momentum `Department`** (if DepartmentGroup is null)
   - Example: "Production: XP"
   - Example: "Business Leadership: Account Management"

3. **Graph API department** (if both Momentum fields are null)
   - Example: "Technology" (from Azure AD)

4. **"Unknown"** (if all sources are null)

---

## 🚀 After Fix is Applied

Once you've fixed the Response action and saved:

1. **Test the flow** using `node test-department-flow.js`
2. **Verify success** (should complete in 1-2 seconds)
3. **Start the app** with `npm run dev`
4. **Log in** and check browser console for:
   ```
   [AuthGuard] Fetching Momentum department data...
   [DepartmentService] Successfully fetched 1047 Momentum users in 1500ms
   [AuthGuard] Momentum department data loaded successfully
   ```
5. **Verify telemetry** event `departmentDataFetched` sent to Power Automate

---

## 📞 Troubleshooting

### Still Getting 504 Timeout?

**Check**:
1. Response action is saved correctly
2. No syntax errors in Response Body (red underlines)
3. SQL action name matches exactly in expressions
4. Flow is enabled (not disabled)

### Response Returns Empty Array?

**Check**:
1. SQL view returns data: `SELECT * FROM [dbo].[vw_Personnel_MeetingNotes]`
2. SQL action connection is correct
3. User running flow has read permissions on view

### Data Structure Doesn't Match?

**Check**:
1. Field names are case-sensitive: `EmailAddress` not `emailAddress`
2. SQL query returns columns with exact names shown in sample
3. Use "Code view" in Response action to verify JSON structure

---

## 📚 Additional Resources

- [Power Automate Expression Reference](https://learn.microsoft.com/en-us/power-automate/use-expressions-in-conditions)
- [SQL Connector Documentation](https://learn.microsoft.com/en-us/connectors/sql/)
- [Response Action Guide](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-workflow-actions-triggers#response-action)

---

**Last Updated**: 2025-10-30
**Application**: Meeting Notes Generator (Momo)
**Flow**: momentum-department-lookup
