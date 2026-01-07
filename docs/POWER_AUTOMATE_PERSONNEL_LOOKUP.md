# Power Automate Flow: Personnel Lookup

## Overview

This Power Automate flow queries the SQL `vw_Personnel` view to retrieve employee department and role information based on email address. The flow is called by the backend proxy at `/api/personnel/lookup`.

---

## Flow Architecture

```
HTTP Request (POST)
    ↓
Extract email from request body
    ↓
Query SQL: vw_Personnel
    ↓
Check if results returned
    ├─ Yes → Return employee data
    └─ No → Return default values (General department)
```

---

## Step-by-Step Setup

### Step 1: Create New Flow

1. Navigate to [Power Automate](https://make.powerautomate.com)
2. Click **Create** → **Automated cloud flow**
3. Name: `Personnel Lookup - Momentum Knowledge Assistant`
4. Trigger: **When an HTTP request is received**
5. Click **Create**

---

### Step 2: Configure HTTP Trigger

**Trigger Name:** `When an HTTP request is received`

**Request Body JSON Schema:**
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "Employee email address to lookup"
    }
  },
  "required": ["email"]
}
```

**Method:** `POST`

**Save the flow** to generate the HTTP POST URL (you'll need this for the backend `.env` file)

---

### Step 3: Add SQL Query Action

**Action:** `SQL Server - Execute query (V2)` or `SQL Server - Get rows (V2)`

**Connection:**
- Server name: `your-sql-server.database.windows.net`
- Database name: `your-database-name`
- Authentication: SQL Server Authentication or Azure AD

**SQL Query:**
```sql
SELECT TOP 1
    [Employee ID] as employeeId,
    [Name] as name,
    [Email Address] as email,
    [Department Group] as departmentGroup,
    [Department] as department,
    [Role] as role,
    [Status] as status,
    [Personnel Area (Vantage)] as personnelArea
FROM vw_Personnel
WHERE LOWER([Email Address]) = LOWER(@{triggerBody()?['email']})
    AND [Status] = 'Active'
ORDER BY [Employee ID] DESC
```

**Notes:**
- `LOWER()` ensures case-insensitive matching
- `TOP 1` ensures only one result (in case of duplicates)
- Filter by `Status = 'Active'` to exclude withdrawn/terminated employees
- `ORDER BY [Employee ID] DESC` gets the most recent record if duplicates exist

---

### Step 4: Add Condition Check

**Action:** `Condition`

**Expression:**
```
length(outputs('Execute_query_(V2)')?['body/value'])
```

**Condition:** `is greater than` `0`

This checks if any rows were returned from the SQL query.

---

### Step 5: Configure "If Yes" Branch (Employee Found)

**Action:** `Response`

**Status Code:** `200`

**Body:**
```json
{
  "employeeId": "@{outputs('Execute_query_(V2)')?['body/value'][0]['employeeId']}",
  "name": "@{outputs('Execute_query_(V2)')?['body/value'][0]['name']}",
  "email": "@{outputs('Execute_query_(V2)')?['body/value'][0]['email']}",
  "departmentGroup": "@{outputs('Execute_query_(V2)')?['body/value'][0]['departmentGroup']}",
  "department": "@{outputs('Execute_query_(V2)')?['body/value'][0]['department']}",
  "role": "@{outputs('Execute_query_(V2)')?['body/value'][0]['role']}",
  "status": "@{outputs('Execute_query_(V2)')?['body/value'][0]['status']}",
  "personnelArea": "@{outputs('Execute_query_(V2)')?['body/value'][0]['personnelArea']}"
}
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

---

### Step 6: Configure "If No" Branch (Employee Not Found)

**Action:** `Response`

**Status Code:** `200`

**Body:**
```json
{
  "employeeId": null,
  "name": "Unknown User",
  "email": "@{triggerBody()?['email']}",
  "departmentGroup": "General",
  "department": "General",
  "role": "Employee",
  "status": "Unknown",
  "personnelArea": "Unknown"
}
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Note:** This ensures the application always receives a valid response, even if the employee is not found in the database. The "General" department provides a safe fallback.

---

## Sample Request & Response

### Request (from backend)

```http
POST https://prod-xx.eastus.logic.azure.com:443/workflows/.../invoke
Content-Type: application/json

{
  "email": "james.gavigan@momentumww.com"
}
```

### Response (Employee Found)

```json
{
  "employeeId": "10033079",
  "name": "6004 James Gavigan",
  "email": "james.gavigan@momentumww.com",
  "departmentGroup": "Experience Production (XP)",
  "department": "Production: XP",
  "role": "6004 Group Experience Production, Director, VP",
  "status": "Active",
  "personnelArea": "Momentum NA"
}
```

### Response (Employee Not Found)

```json
{
  "employeeId": null,
  "name": "Unknown User",
  "email": "unknown@momentumww.com",
  "departmentGroup": "General",
  "department": "General",
  "role": "Employee",
  "status": "Unknown",
  "personnelArea": "Unknown"
}
```

---

## Backend Configuration

After creating the flow, copy the **HTTP POST URL** and add it to the backend `.env` file:

```env
# backend/.env
PERSONNEL_LOOKUP_FLOW_URL=https://prod-xx.eastus.logic.azure.com:443/workflows/abc123.../triggers/manual/paths/invoke?api-version=2016-06-01&sp=triggers&sv=1.0&sig=xyz789...
```

---

## Testing the Flow

### Test in Power Automate

1. Click **Test** → **Manually**
2. Click **Test** → **Run flow**
3. Enter test payload:
   ```json
   {
     "email": "james.gavigan@momentumww.com"
   }
   ```
4. Click **Run flow**
5. Verify the response matches expected data

### Test from Backend

Using Postman or curl:

```bash
curl -X POST https://prod-xx.eastus.logic.azure.com:443/workflows/.../invoke \
  -H "Content-Type: application/json" \
  -d '{"email":"james.gavigan@momentumww.com"}'
```

Expected response: Employee data from vw_Personnel

---

## Error Handling

### SQL Connection Errors

**Issue:** Flow fails with "Unable to connect to SQL Server"

**Solutions:**
- Verify SQL Server firewall allows Power Automate IP ranges
- Check SQL credentials are correct
- Ensure database is accessible (not paused/offline)

### Empty Results

**Issue:** Query returns no rows for known employee

**Possible Causes:**
- Email address mismatch (check capitalization, spacing)
- Employee status is not "Active" (check Status field)
- Employee not in vw_Personnel view (check data source)

**Debugging:**
- Run the SQL query directly in SQL Server Management Studio
- Check for trailing spaces in email addresses: `TRIM([Email Address])`
- Verify the view has data: `SELECT COUNT(*) FROM vw_Personnel`

### Timeout Issues

**Issue:** Flow times out on SQL query

**Solutions:**
- Add index on `Email Address` column for faster lookups
- Optimize the SQL query (remove unnecessary columns)
- Check SQL Server performance metrics

---

## Performance Optimization

### Indexing

Create an index on the email column for faster lookups:

```sql
CREATE NONCLUSTERED INDEX IX_vwPersonnel_EmailAddress
ON vw_Personnel ([Email Address])
INCLUDE ([Employee ID], [Name], [Department Group], [Department], [Role]);
```

### Caching

The frontend caches personnel lookups for **24 hours** in localStorage, reducing API calls:

- Cache key: `personnel_data_cache_{email}`
- TTL: 86400000 ms (24 hours)
- Circuit breaker: Opens after 3 consecutive failures

---

## Data Privacy & Security

### Sensitive Data

The vw_Personnel view contains sensitive employee information. Ensure:

- ✅ Flow URL is stored as environment variable (not in code)
- ✅ Flow URL includes SAS token with expiration
- ✅ HTTPS only (never HTTP)
- ✅ Backend JWT validation before calling flow

### Fields Excluded

The following fields from vw_Personnel.csv are **NOT** returned by the flow (privacy):

- ❌ Salary/Cost Rate
- ❌ Billable Rate Tier
- ❌ Supervisor ID/Name (unless needed)
- ❌ Personnel Subarea
- ❌ Skills, Permissions, Access Groups (KT-specific)

Only essential fields for department-based access control are returned.

---

## Monitoring & Maintenance

### Flow Analytics

Monitor flow performance in Power Automate:

- **Runs**: Track success/failure rate
- **Duration**: Average execution time (target: < 2 seconds)
- **Errors**: Common error messages and patterns

### Alerting

Set up alerts for:

- Flow failures (> 5% failure rate)
- Slow queries (> 5 seconds)
- High request volume (> 1000/day)

### Data Refresh

If vw_Personnel data is updated (new employees, department changes):

- Frontend cache will refresh after 24 hours automatically
- Or users can clear cache manually via browser console:
  ```javascript
  localStorage.removeItem('personnel_data_cache_user@momentumww.com');
  ```

---

## Troubleshooting Checklist

- [ ] Flow URL is correct in backend `.env`
- [ ] SQL Server allows Power Automate IP ranges
- [ ] SQL credentials are valid
- [ ] vw_Personnel view exists and has data
- [ ] Email address format matches exactly (no extra spaces)
- [ ] Employee status is "Active"
- [ ] Response schema matches expected format
- [ ] Backend proxy forwards requests correctly
- [ ] Frontend caching is working (check localStorage)

---

## Related Documentation

- [Backend Server Configuration](../backend/README.md)
- [Personnel Service Documentation](../services/personnelService.ts)
- [Department Service Pattern](../services/departmentService.ts)
- [vw_Personnel Sample Data](../SQL_sample_files/vw_Personnel.csv)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial documentation for Momentum Knowledge Assistant |
