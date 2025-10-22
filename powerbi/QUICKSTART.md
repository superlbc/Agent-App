# Power BI Dashboards - Quick Start Guide

Get your telemetry dashboards running in **5-10 minutes**.

---

## ✅ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Power BI Desktop** installed (March 2023 or later)
  - Download: https://powerbi.microsoft.com/desktop/

- [ ] **SQL Server access** with connection details:
  - Server name (e.g., `your-server.database.windows.net`)
  - Database name (e.g., `TelemetryDB`)
  - Username and password (or Windows/Azure AD auth)

- [ ] **SQL views created** (run database scripts first):
  ```
  cd ..\database
  .\deploy-views.ps1
  ```

- [ ] **Read permissions** on these views:
  - `vw_MeetingNotesGenerator`
  - `vw_EstimateCrafter`
  - `vw_UnifiedAnalytics`

---

## 🚀 Option 1: Manual Setup (Recommended First Time)

### Step 1: Test SQL Connection (2 minutes)

```powershell
# Navigate to scripts folder
cd powerbi\scripts

# Edit connection config
notepad ..\config\sql-connection.json

# Update with your details:
# - server: your-server.database.windows.net
# - database: TelemetryDB
# - username: your_username
# - password: your_password

# Test connection
.\validate-connection.ps1
```

**Expected output:**
```
✓ Connected successfully
✓ View exists: vw_MeetingNotesGenerator (3,847 rows)
✓ View exists: vw_EstimateCrafter (1,234 rows)
✓ View exists: vw_UnifiedAnalytics (5,081 rows)

Connection Status: READY ✓
```

---

### Step 2: Create Your First Dashboard (5 minutes)

#### A. Meeting Notes Generator Dashboard

1. **Open Power BI Desktop**

2. **Get Data**
   - Home → Get Data → SQL Server
   - Server: `your-server.database.windows.net`
   - Database: `TelemetryDB`
   - Click **OK**

3. **Sign in** (if prompted)
   - Use SQL Server credentials or Windows/Azure AD

4. **Select view**
   - In Navigator, check `vw_MeetingNotesGenerator`
   - Click **Load**

5. **Import DAX Measures**
   - Open `measures\meeting-notes-measures.dax` in Notepad
   - In Power BI: Modeling → New Measure
   - Copy/paste each measure from the file

   **Quick import tip:** Copy the whole file, then paste measures one at a time

6. **Create first visual (Total Events Card)**
   - Visualizations → Card
   - Fields → drag `Total Events` measure to visual
   - Format → Callout value → Text size: 48px

7. **Save file**
   - File → Save As
   - Name: `meeting-notes-dashboard.pbix`

---

### Step 3: Add More Visuals (Follow Specifications)

Use the detailed specifications to add more visuals:

```
Open: dashboards\meeting-notes-spec.md
```

Each visual has step-by-step instructions like:

```markdown
### Visual: Total Events Card
- Type: Card
- Position: Row 1, Column 1
- Data: [Total Events] measure
- Format: Text size 48px, bold
```

---

### Step 4: Publish to Power BI Service (2 minutes)

1. **In Power BI Desktop**
   - File → Publish
   - Select workspace (or create new one: "Momo Analytics")
   - Click **Publish**

2. **In Power BI Service (web)**
   - Go to https://app.powerbi.com
   - Navigate to your workspace
   - Click on the published dashboard

3. **Share with stakeholders**
   - Click **Share** button
   - Add email addresses
   - Select "Allow recipients to view" (read-only)
   - Click **Grant access**

4. **Configure refresh** (if data needs to update daily)
   - Workspace → Datasets → ... → Settings
   - Scheduled refresh → On
   - Frequency: Daily at 6:00 AM
   - Apply

---

## 🔧 Option 2: Using DAX Import Script

If you have [Tabular Editor](https://tabulareditor.com/) installed:

```powershell
cd powerbi\scripts
.\import-measures.ps1 -DashboardType "meeting-notes" -PBIXFile "C:\path\to\dashboard.pbix"
```

This automatically imports all 60 measures at once!

---

## 📊 Dashboard Build Order (Recommended)

Build dashboards in this order:

1. **Meeting Notes Generator** (easiest, 30 minutes)
   - View: `vw_MeetingNotesGenerator`
   - Measures: `measures\meeting-notes-measures.dax`
   - Spec: `dashboards\meeting-notes-spec.md`

2. **EstimateCrafter** (medium, 30 minutes)
   - View: `vw_EstimateCrafter`
   - Measures: `measures\estimatecrafter-measures.dax`
   - Spec: `dashboards\estimatecrafter-spec.md`

3. **Unified Analytics** (advanced, 20 minutes)
   - View: `vw_UnifiedAnalytics`
   - Measures: `measures\unified-measures.dax`
   - Spec: `dashboards\unified-spec.md`

---

## ⚡ Quick Troubleshooting

### "Can't connect to database"
```
✓ Check server name (no typos)
✓ Check firewall (whitelist your IP)
✓ Run: .\validate-connection.ps1
```

### "View not found"
```
✓ Run database scripts first:
  cd ..\database
  .\deploy-views.ps1
```

### "Measure error"
```
✓ Check spelling of view name
✓ Check column names match view
✓ Verify data loaded (should see rows in Data view)
```

### "Can't publish"
```
✓ Sign in to Power BI Service
✓ Check you have Pro license or Premium workspace
✓ Create workspace first if needed
```

---

## 📚 Next Steps

**After your first dashboard works:**

1. **Build the other two dashboards** (same process)

2. **Customize visuals**
   - Change colors (Format → Colors)
   - Add tooltips (Format → Tooltips)
   - Resize and reposition

3. **Schedule refresh**
   - Power BI Service → Dataset Settings
   - Scheduled refresh → Daily at 6 AM

4. **Create mobile view**
   - View → Mobile Layout
   - Drag key visuals to mobile canvas

5. **Embed in SharePoint** (optional)
   - Get embed code from Power BI Service
   - Add to SharePoint page

---

## 🎓 Learning Resources

**If this is your first Power BI dashboard:**

- [Power BI Guided Learning](https://docs.microsoft.com/power-bi/guided-learning/) (30 min course)
- [DAX Basics](https://dax.guide/learn/) (understand measures)
- [Visual Types](https://docs.microsoft.com/power-bi/visuals/) (choose the right visual)

**For help:**
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- See [README.md](README.md) for detailed documentation

---

## ✅ Success Checklist

You're done when:

- [ ] All 3 dashboards built and published
- [ ] Data refreshes successfully
- [ ] Stakeholders can view online
- [ ] All measures show correct values
- [ ] No errors in Power BI Service

---

**Estimated Total Time:**
- First dashboard: 30-40 minutes
- Second dashboard: 20-30 minutes (you know the process now)
- Third dashboard: 15-20 minutes

**Total: ~1.5 hours for all 3 dashboards**

Good luck! 🎉
