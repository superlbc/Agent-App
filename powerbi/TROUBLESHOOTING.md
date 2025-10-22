# Power BI Dashboards - Troubleshooting Guide

Common issues and solutions for Momo Analytics Platform dashboards.

---

## 🔌 Connection Issues

### Error: "Can't connect to the database"

**Symptoms:**
- Power BI Desktop shows "Unable to connect"
- Error message: "A network-related or instance-specific error occurred"

**Solutions:**

1. **Verify server name**
   ```
   Correct: your-server.database.windows.net
   Wrong: your-server (missing .database.windows.net)
   ```

2. **Check firewall rules**
   - Azure SQL: Add your client IP to firewall rules
   - On-premises: Ensure SQL Server allows remote connections

3. **Test with PowerShell script**
   ```powershell
   cd powerbi\scripts
   .\validate-connection.ps1
   ```

4. **Verify credentials**
   - Username format for Azure SQL: `username` (not `username@domain`)
   - Password: No special escaping needed in JSON

5. **Check SQL Server is running**
   ```powershell
   # For Azure SQL
   Test-NetConnection your-server.database.windows.net -Port 1433

   # Should return: TcpTestSucceeded : True
   ```

---

### Error: "Login failed for user"

**Symptoms:**
- Connection string is correct but authentication fails

**Solutions:**

1. **For SQL Authentication:**
   - Verify username/password are correct
   - Check user has db_datareader role
   - Try connecting with SQL Server Management Studio first

2. **For Windows Authentication:**
   - Only works with on-premises SQL Server
   - Ensure your Windows account has access
   - Must be on same network/domain

3. **For Azure AD Authentication:**
   - Your Azure AD account must be added to database
   - Run in database:
     ```sql
     CREATE USER [user@domain.com] FROM EXTERNAL PROVIDER;
     ALTER ROLE db_datareader ADD MEMBER [user@domain.com];
     ```

---

## 📊 Data Issues

### Error: "View not found"

**Symptoms:**
- Power BI can't find `vw_MeetingNotesGenerator` or other views

**Solutions:**

1. **Create SQL views first**
   ```powershell
   cd database
   .\deploy-views.ps1
   ```

2. **Verify views exist in SQL**
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.VIEWS
   WHERE TABLE_NAME LIKE 'vw_%'
   ```

3. **Check permissions**
   ```sql
   -- Grant read access
   GRANT SELECT ON vw_MeetingNotesGenerator TO [your_user];
   GRANT SELECT ON vw_EstimateCrafter TO [your_user];
   GRANT SELECT ON vw_UnifiedAnalytics TO [your_user];
   ```

---

### Error: "Empty dashboard / No data"

**Symptoms:**
- Dashboard loads but shows "No data"
- Visuals are blank
- Measures show 0 or BLANK

**Solutions:**

1. **Check if AppEvents table has data**
   ```sql
   SELECT COUNT(*) FROM AppEvents;
   SELECT TOP 10 * FROM AppEvents ORDER BY Timestamp DESC;
   ```

2. **Verify views return data**
   ```sql
   SELECT COUNT(*) FROM vw_MeetingNotesGenerator;
   SELECT COUNT(*) FROM vw_EstimateCrafter;
   SELECT COUNT(*) FROM vw_UnifiedAnalytics;
   ```

3. **Check date filters**
   - Views filter last 1 year by default
   - If data is older, modify view WHERE clause

4. **Refresh data in Power BI**
   - Home → Refresh
   - Wait for refresh to complete

---

## 📐 Measure Issues

### Error: "The expression refers to multiple columns"

**Symptoms:**
- DAX measure won't save
- Error when creating measure

**Solutions:**

1. **Check column references**
   ```dax
   # Wrong
   SUM(EventType)  # EventType is text, can't SUM

   # Correct
   COUNT(vw_MeetingNotesGenerator[EventType])
   ```

2. **Use table name prefix**
   ```dax
   # Wrong
   DISTINCTCOUNT(UserEmail)

   # Correct
   DISTINCTCOUNT(vw_MeetingNotesGenerator[UserEmail])
   ```

3. **Check for typos**
   - Column names are case-sensitive
   - `UserEmail` ≠ `useremail`

---

### Error: "Circular dependency detected"

**Symptoms:**
- Can't create measure that references another measure

**Solutions:**

1. **Check measure dependencies**
   - Make sure measures don't reference each other circularly
   - A → B → A creates circular dependency

2. **Rewrite measure**
   ```dax
   # Instead of this circular pattern:
   Measure A = [Measure B] + 1
   Measure B = [Measure A] - 1

   # Do this:
   Base Value = COUNTROWS(Table)
   Measure A = [Base Value] + 1
   Measure B = [Base Value] - 1
   ```

---

## 🖼️ Visual Issues

### Error: "Couldn't load the visual"

**Symptoms:**
- Visual shows error icon
- Visual won't render

**Solutions:**

1. **Check data type mismatch**
   - Line chart needs date on X-axis
   - Bar chart needs numeric on values
   - Card needs single number

2. **Check for NULL values**
   ```dax
   # Add NULL handling
   Safe Measure =
   IF(
       ISBLANK([Original Measure]),
       0,
       [Original Measure]
   )
   ```

3. **Reduce data volume**
   - Too many data points can cause rendering issues
   - Add TOP N filter
   - Aggregate data

---

### Issue: "Visual is slow to load"

**Symptoms:**
- Visual takes 5+ seconds to render
- Dashboard feels sluggish

**Solutions:**

1. **Optimize DAX measures**
   ```dax
   # Slow
   Total Events = COUNTROWS(FILTER(ALL(Table), Condition))

   # Fast
   Total Events = CALCULATE(COUNTROWS(Table), Condition)
   ```

2. **Use Import mode (not DirectQuery)**
   - Import is 10-100x faster
   - Data stored in memory

3. **Add aggregations**
   - Pre-aggregate data in SQL view
   - Don't calculate everything in DAX

4. **Reduce visual complexity**
   - Fewer data points
   - Simpler calculations
   - Remove unnecessary custom visuals

---

## 📤 Publishing Issues

### Error: "Can't publish to workspace"

**Symptoms:**
- Publish button is grayed out
- Error: "You don't have permission"

**Solutions:**

1. **Sign in to Power BI**
   - File → Sign In
   - Use your organizational account

2. **Check license**
   - You need Power BI Pro OR
   - Premium Per User (PPU) OR
   - Workspace in Premium Capacity

3. **Check workspace permissions**
   - You need Member or Admin role in workspace
   - Ask workspace admin to add you

4. **Create workspace first**
   - Go to https://app.powerbi.com
   - Workspaces → Create workspace
   - Name it "Momo Analytics"

---

### Error: "Scheduled refresh failed"

**Symptoms:**
- Email: "We couldn't refresh your dataset"
- Dashboard shows old data

**Solutions:**

1. **For Azure SQL (no gateway needed):**
   - Dataset Settings → Data source credentials
   - Edit credentials → Re-enter username/password
   - Test connection

2. **For On-Premises SQL (gateway required):**
   - Install Power BI Gateway on server
   - Configure gateway connection
   - Dataset Settings → Gateway connection → Select your gateway

3. **Check connection string**
   - Power BI Service stores connection string
   - Settings → Data source credentials → Edit
   - Re-enter credentials

4. **Check firewall**
   - Azure SQL: Add Power BI IP ranges
   - List: https://docs.microsoft.com/power-bi/admin/service-admin-power-bi-security#ip-addresses

---

## 🔐 Permission Issues

### Error: "Stakeholders can't see dashboard"

**Symptoms:**
- You shared the dashboard
- Users say "Access denied" or don't see it

**Solutions:**

1. **Check if users have Power BI licenses**
   - Free license: Can only view in Premium workspace
   - Pro license: Can view any shared dashboard
   - Solution: Use Premium workspace OR users need Pro

2. **Re-share dashboard**
   - Workspace → Dashboard → Share
   - Add email addresses
   - Check "Allow recipients to view"
   - Send

3. **Check workspace access**
   - Workspace → Access
   - Add users with "Viewer" role

4. **Check app permissions (if using app)**
   - Create app from workspace
   - Publish app
   - Add users to app audience

---

## 💾 Data Refresh Issues

### Error: "Gateway timeout"

**Symptoms:**
- Refresh fails with timeout error
- Large datasets don't refresh

**Solutions:**

1. **Increase timeout**
   - Dataset Settings → Query timeout
   - Change from 10 minutes to 30 minutes

2. **Optimize SQL views**
   - Add indexes to AppEvents table
   - Reduce date range in WHERE clause
   - Pre-aggregate data

3. **Use incremental refresh**
   - Power BI Pro/Premium feature
   - Only refresh new data
   - Keep historical data

---

### Issue: "Refresh takes too long"

**Symptoms:**
- Refresh takes 10+ minutes
- Hitting timeout limits

**Solutions:**

1. **Check SQL view performance**
   ```sql
   -- Add execution time
   SET STATISTICS TIME ON;
   SELECT * FROM vw_MeetingNotesGenerator;
   ```

2. **Add indexes**
   ```sql
   CREATE INDEX IX_AppEvents_Timestamp
   ON AppEvents(Timestamp DESC)
   INCLUDE (EventType, UserEmail);
   ```

3. **Reduce data volume**
   - Change view to last 90 days instead of 1 year
   - Aggregate older data

4. **Enable parallel loading**
   - File → Options → Data Load
   - Enable parallel loading
   - Reduce timeout value

---

## 🔧 Power BI Desktop Issues

### Error: "This file was created with a newer version"

**Symptoms:**
- Can't open .pbix file
- Version mismatch error

**Solutions:**

1. **Update Power BI Desktop**
   - Download latest from: https://powerbi.microsoft.com/desktop/
   - Minimum version: March 2023 for PBIR support

2. **Check Windows version**
   - Power BI requires Windows 10 or later
   - Windows 11 recommended

---

### Error: "Out of memory"

**Symptoms:**
- Power BI crashes
- Error: "Not enough memory"

**Solutions:**

1. **Close other applications**
   - Power BI uses lot of RAM
   - Close Excel, Chrome, etc.

2. **Reduce dataset size**
   - Import less data (shorter date range)
   - Remove unused columns
   - Remove unused tables

3. **Upgrade RAM**
   - Minimum: 4 GB
   - Recommended: 8 GB+
   - Ideal: 16 GB for large datasets

---

## 📱 Mobile App Issues

### Issue: "Dashboard doesn't look good on mobile"

**Symptoms:**
- Visuals are tiny
- Layout is cramped
- Can't read text

**Solutions:**

1. **Create mobile layout**
   - View → Mobile Layout
   - Drag only key visuals to mobile canvas
   - Resize for mobile screen

2. **Use mobile-friendly visuals**
   - Cards (KPIs)
   - Simple bar charts
   - Avoid complex tables

3. **Increase font sizes**
   - Format → Text → Size: 14pt minimum for mobile

---

## 🆘 Getting Help

### Built-in Diagnostics

```powershell
# Test SQL connection
cd powerbi\scripts
.\validate-connection.ps1

# Check for common issues
Get-EventLog -LogName Application -Source "Power BI" -Newest 10
```

### Log Files

**Power BI Desktop logs:**
```
C:\Users\<username>\AppData\Local\Microsoft\Power BI Desktop\AnalysisServicesWorkspaces
```

**Power BI Gateway logs:**
```
C:\Users\<username>\AppData\Local\Microsoft\On-premises data gateway\Logs
```

### Resources

- **Power BI Community:** https://community.powerbi.com/
- **Microsoft Docs:** https://docs.microsoft.com/power-bi/
- **DAX Guide:** https://dax.guide/
- **SQLBI (DAX experts):** https://www.sqlbi.com/

### Internal Support

- **Database Issues:** Data Team
- **Dashboard Issues:** IT/DevOps
- **Requirements:** Product Team
- **Power BI Licensing:** IT Admin

---

## 📋 Diagnostic Checklist

When asking for help, provide:

- [ ] Power BI Desktop version (Help → About)
- [ ] Windows version (Settings → System → About)
- [ ] Error message (screenshot)
- [ ] What you were doing when error occurred
- [ ] Connection validation results (`.\validate-connection.ps1` output)
- [ ] SQL Server version (Azure SQL or On-Premises)

---

**Still stuck?**

Check the main [README.md](README.md) for detailed documentation or create an issue in the repository.
