# Building Power BI Dashboards - Step-by-Step Guide

**⏱ Estimated Time: 1.5 hours total (30 minutes per dashboard)**

This guide walks you through building the 3 Power BI dashboard files (.pbix) that the automation scripts will deploy. This is a **one-time manual process** - once these files are built, all future deployments are fully automated.

---

## Prerequisites

✅ **Power BI Desktop installed** ([Download here](https://powerbi.microsoft.com/desktop/))
✅ **SQL Server connection details** (from `config/sql-connection.json`)
✅ **SQL Views created** (vw_MeetingNotesGenerator, vw_EstimateCrafter, vw_UnifiedAnalytics)
✅ **DAX measure files ready** (`measures/*.dax`)

---

## Overview

You'll build 3 dashboards:
1. **Meeting Notes Generator Dashboard** (~30 min)
2. **EstimateCrafter Dashboard** (~30 min)
3. **Unified Analytics Dashboard** (~30 min)

Each dashboard follows the same process:
1. Connect to SQL Server view
2. Copy/paste DAX measures
3. Create visualizations
4. Format and arrange
5. Save as .pbix file

---

## Dashboard 1: Meeting Notes Generator

### Step 1: Create New Report (2 minutes)

1. **Open Power BI Desktop**
2. Click **Get Data** > **SQL Server**
3. Enter connection details:
   - **Server**: `your-server.database.windows.net` (from config)
   - **Database**: `TelemetryDB` (from config)
   - **Data Connectivity**: DirectQuery (recommended) or Import
4. Click **OK**, authenticate if prompted
5. Select table: `vw_MeetingNotesGenerator`
6. Click **Load**

### Step 2: Add DAX Measures (10 minutes)

1. In the **Data** pane (right side), right-click on `vw_MeetingNotesGenerator`
2. Select **New Measure**
3. Open `measures/meeting-notes-measures.dax` in a text editor
4. **Copy the first measure** (starts with `// Total Events`)
5. **Paste into the formula bar** in Power BI Desktop
6. Press **Enter** to save
7. **Repeat for all 69 measures**

**💡 Pro Tip**: Copy multiple measures at once - Power BI will create them sequentially.

**Expected Measures** (69 total):
- Base Metrics (8 measures)
- Core Functionality (6 measures)
- Export Metrics (10 measures)
- Preset Metrics (4 measures)
- Interrogate Metrics (8 measures)
- Data Input Metrics (4 measures)
- Tour Metrics (6 measures)
- Settings Metrics (2 measures)
- User Engagement (6 measures)
- Time-Based Metrics (6 measures)

### Step 3: Create Visualizations (15 minutes)

#### Page 1: Overview Dashboard

**Visual 1: KPI Cards (Top Row)**
- Insert **Card** visual (4 cards across the top)
- Card 1: `Total Users`
- Card 2: `Notes Generated`
- Card 3: `Total Exports`
- Card 4: `Tour Completion Rate`

**Visual 2: Usage Over Time**
- Insert **Line Chart**
- X-axis: `EventDate`
- Y-axis: `Total Events`
- Legend: `EventType`

**Visual 3: Top Users Table**
- Insert **Table**
- Columns: `UserEmail`, `Total Events`, `Notes Generated`, `Total Exports`, `Last Active Date`
- Sort by: `Total Events` (descending)
- Format `Last Active Date` as short date

**Visual 4: Feature Adoption Funnel**
- Insert **Funnel Chart**
- Values: `Total Logins` → `Notes Generated` → `Total Exports`

**Visual 5: Export Breakdown**
- Insert **Pie Chart**
- Legend: Export type (PDF, Clipboard, Email, CSV)
- Values: Count of each export type

#### Page 2: User Engagement

**Visual 6: Active Users Trend**
- Insert **Area Chart**
- X-axis: `EventDate`
- Y-axis: `Active Users This Week` (or use `Active Users This Month`)

**Visual 7: Power Users**
- Insert **Table**
- Filter: Users with > 50 events
- Columns: `UserEmail`, `Total Events`, `Last Active Date`

**Visual 8: Session Duration Distribution**
- Insert **Clustered Column Chart**
- **X-axis**: Add `SessionID` field
- **Values**: Add `Session Duration Bucket` measure
- **Y-axis**: Add `Session Count` measure
- **Sort**: Click visual → More options (···) → Sort by → `Session Duration Bucket`
  - Custom sort order: < 1 min, 1-5 min, 5-10 min, 10-30 min, 30-60 min, 60+ min
- **What this shows**: Distribution of session lengths
  - Example: "45 sessions lasted 1-5 minutes, 32 sessions lasted 5-10 minutes"
- **Alternative (simpler)**: Use histogram visual with `Avg Session Duration Min` on X-axis

**Visual 9: Time of Day Heatmap**
- Insert **Matrix**
- Rows: Day of Week
- Columns: Hour of Day
- Values: `Total Events`

#### Page 3: Feature Usage

**Visual 10: Preset Usage**
- Insert **Bar Chart**
- Y-axis: Preset names (parsed from `PresetName` field)
- X-axis: `Preset Selections`

**Visual 11: Interrogate Adoption**
- Insert **Gauge**
- Value: `Interrogate Adoption Rate`
- Target: 50%

**Visual 12: Tour Metrics**
- Insert **Clustered Column Chart**
- X-axis: Tour event types
- Y-axis: Count
- Columns: Started, Completed, Dismissed

**Visual 13: Export Rate Trend**
- Insert **Line Chart**
- X-axis: `EventDate`
- Y-axis: `Export Rate`

### Step 4: Format and Style (3 minutes)

1. **Apply Theme**:
   - Format pane > Theme > Select "Executive" or custom theme
2. **Add Title**:
   - Insert > Text Box > "Meeting Notes Generator Analytics"
   - Font: Segoe UI, 24pt, Bold
3. **Add Filters**:
   - Add slicers for: Date Range, UserEmail, EventType
4. **Align Visuals**:
   - Select all visuals > Format > Align > Distribute evenly

### Step 5: Save File

1. **File** > **Save As**
2. Navigate to: `powerbi/dashboards/`
3. Filename: `MeetingNotesGenerator.pbix`
4. Click **Save**

✅ **Dashboard 1 Complete!**

---

## Dashboard 2: EstimateCrafter

### Step 1: Create New Report (2 minutes)

1. **File** > **New** (or open new Power BI Desktop window)
2. **Get Data** > **SQL Server**
3. Enter connection details (same as before)
4. Select table: `vw_EstimateCrafter`
5. Click **Load**

### Step 2: Add DAX Measures (12 minutes)

1. Right-click `vw_EstimateCrafter` > **New Measure**
2. Open `measures/estimatecrafter-measures.dax`
3. Copy and paste all 75 measures

**Expected Measures** (75 total):
- Estimate Metrics (10 measures)
- Project Lifecycle (8 measures)
- Scope Curation (8 measures)
- Value Engineering (10 measures)
- Missing Items (8 measures)
- AI Chat (8 measures)
- Scenarios (6 measures)
- Insights (6 measures)
- Exports (6 measures)
- Batch Operations (5 measures)

### Step 3: Create Visualizations (15 minutes)

#### Page 1: Overview Dashboard

**Visual 1: KPI Cards**
- Total Users
- Estimates Generated
- Total VE Savings
- AI Adoption Rate

**Visual 2: Estimate Value Distribution**
- Insert **Histogram**
- X-axis: `Estimate Value` (bins)
- Y-axis: Count

**Visual 3: VE Savings Over Time**
- Insert **Area Chart**
- X-axis: `EventDate`
- Y-axis: `Total VE Savings`

**Visual 4: Top Projects Table**
- Insert **Table**
- Columns: `ProjectNumber`, `Estimate Value`, `VE Savings`, `Export Count`

**Visual 5: Feature Adoption Funnel**
- Insert **Funnel**
- Values: Projects Created → Estimates Generated → VE Applied → Exported

#### Page 2: Value Engineering

**Visual 6: VE Acceptance Rate**
- Insert **Gauge**
- Value: `VE Acceptance Rate`
- Target: 70%

**Visual 7: VE Savings by Category**
- Insert **Treemap**
- Category: VE category (parsed from payload)
- Values: `Total VE Savings`

**Visual 8: VE Trend**
- Insert **Combo Chart**
- Line: `VE Acceptance Rate`
- Column: `VE Options Applied`
- X-axis: `EventDate`

**Visual 9: Missing Items**
- Insert **Clustered Bar Chart**
- Y-axis: Applied vs Dismissed
- X-axis: Count

#### Page 3: AI & Engagement

**Visual 10: AI Chat Metrics**
- Insert **Card** visuals (4 cards)
  - Total Chat Messages
  - Avg Message Length
  - Avg Conversation Length
  - AI Adoption Rate

**Visual 11: Chat Activity Timeline**
- Insert **Line Chart**
- X-axis: `EventDate`
- Y-axis: `Total Chat Messages`

**Visual 12: Power Users**
- Insert **Table**
- Columns: `UserEmail`, `Projects`, `Estimates`, `VE Applied`, `Chat Messages`

**Visual 13: Scenario Usage**
- Insert **Column Chart**
- X-axis: User
- Y-axis: `Scenarios Created`

### Step 4: Format and Save

1. Apply theme and formatting (same as Dashboard 1)
2. Add title: "EstimateCrafter Analytics"
3. Add slicers: Date Range, UserEmail, ProjectNumber
4. **Save As**: `powerbi/dashboards/EstimateCrafter.pbix`

✅ **Dashboard 2 Complete!**

---

## Dashboard 3: Unified Analytics

### Step 1: Create New Report (2 minutes)

1. **File** > **New**
2. **Get Data** > **SQL Server**
3. Select table: `vw_UnifiedAnalytics`
4. Click **Load**

### Step 2: Add DAX Measures (12 minutes)

1. Right-click `vw_UnifiedAnalytics` > **New Measure**
2. Open `measures/unified-measures.dax`
3. Copy and paste all 80 measures

**Expected Measures** (80 total):
- Base Metrics (10 measures)
- App-Specific Breakdowns (10 measures)
- App Comparison (8 measures)
- Unified Core Actions (8 measures)
- Unified Export Metrics (8 measures)
- AI Interaction (6 measures)
- Tour Metrics (4 measures)
- File Operations (4 measures)
- User Engagement (10 measures)
- Event Categories (6 measures)
- Time-of-Day Analysis (6 measures)

### Step 3: Create Visualizations (15 minutes)

#### Page 1: Portfolio Overview

**Visual 1: Portfolio Health Score**
- Insert **Gauge**
- Value: `Portfolio Health Score`
- Min: 0, Max: 100
- Target: 75

**Visual 2: App Usage Comparison**
- Insert **Donut Chart**
- Legend: `AppName` (Meeting Notes Generator, EstimateCrafter)
- Values: `Total Events`

**Visual 3: Cross-App Metrics**
- Insert **Multi-row Card**
- Fields: `Total Users`, `Total Logins`, `Total Generations`, `Total Exports`

**Visual 4: App Balance Score**
- Insert **Gauge**
- Value: `App Balance Score`
- Min: 0, Max: 1
- Target: 0.8

**Visual 5: Growth Trends**
- Insert **Combo Chart**
- Line: WoW Growth, MoM Growth
- Column: Total Events
- X-axis: `EventDate`

#### Page 2: User Behavior

**Visual 6: Multi-App Users**
- Insert **Card**
- Value: `Multi-App Users`

**Visual 7: User Retention**
- Insert **Line Chart**
- X-axis: Week number
- Y-axis: `Active Users This Week`, `Returning Users This Week`

**Visual 8: Time-of-Day Heatmap**
- Insert **Matrix**
- Rows: `AppName`
- Columns: Time buckets (Morning, Afternoon, Evening, Night)
- Values: Event count

**Visual 9: Domain Analysis**
- Insert **Table**
- Columns: Domain (parsed from UserEmail), User Count, Total Events, Most Used App

**Visual 10: Power Users Across Apps**
- Insert **Table**
- Columns: UserEmail, MNG Events, EC Events, Total Events, Multi-App indicator

#### Page 3: Operational Insights

**Visual 11: Event Category Distribution**
- Insert **Stacked Bar Chart**
- Y-axis: Event category
- X-axis: Count
- Legend: `AppName`

**Visual 12: Most Active Day**
- Insert **Card**
- Value: Day of week with most events

**Visual 13: Export Comparison**
- Insert **Clustered Column Chart**
- X-axis: Export type (PDF, CSV, HTML, etc.)
- Y-axis: Count
- Legend: `AppName`

**Visual 14: AI Adoption Across Apps**
- Insert **Gauge** (2 gauges side by side)
- Gauge 1: MNG AI Adoption
- Gauge 2: EC AI Adoption

### Step 4: Format and Save

1. Apply theme: "Executive"
2. Add title: "Momo Analytics - Unified Dashboard"
3. Add slicers: Date Range, AppName, UserEmail
4. **Save As**: `powerbi/dashboards/UnifiedAnalytics.pbix`

✅ **Dashboard 3 Complete!**

---

## Verification Checklist

Before running the deployment automation, verify:

- ✅ All 3 .pbix files saved in `powerbi/dashboards/` folder
- ✅ All DAX measures loaded without errors
- ✅ Data refreshes successfully (at least one time)
- ✅ All visuals display data correctly
- ✅ Filters and slicers work properly
- ✅ File sizes reasonable (< 50 MB each)

---

## Next Steps

Once all 3 dashboards are built:

1. **Run Automation**:
   ```powershell
   cd powerbi/scripts
   .\deploy-all.ps1
   ```

2. **Or run steps individually**:
   ```powershell
   .\1-create-workspace.ps1
   .\2-deploy-dashboards.ps1
   .\3-configure-permissions.ps1
   .\4-configure-refresh.ps1
   ```

3. **Configure credentials** in Power BI Service
4. **Share links** with stakeholders

---

## Troubleshooting

### "Can't connect to SQL Server"
- Verify connection details in `config/sql-connection.json`
- Check firewall rules allow your IP
- Ensure SQL authentication is enabled

### "View not found"
- Run SQL view creation scripts first
- Verify views exist: `SELECT * FROM vw_MeetingNotesGenerator`

### "DAX measure error"
- Check for typos in measure names
- Ensure all referenced columns exist in view
- Verify correct view is loaded

### "Slow performance"
- Use DirectQuery instead of Import mode
- Add indexes to SQL views
- Reduce date range in filters

---

## Tips for Faster Dashboard Building

1. **Build one dashboard completely first** - Use it as reference for the others
2. **Copy pages between reports** - Right-click page tab > Duplicate to another file
3. **Use themes** - Apply formatting once, reuse across all dashboards
4. **Group visuals** - Select multiple > Right-click > Group for easier layout
5. **Save frequently** - Power BI Desktop can crash with large datasets

---

## Customization

After building the base dashboards, you can customize:

- **Add your company logo** (Insert > Image)
- **Change color scheme** (Format > Theme > Custom)
- **Add bookmarks** for different views
- **Create drill-through pages** for detailed analysis
- **Add more measures** from the DAX files

All customizations will be preserved when re-deploying via automation.

---

**Questions?** See `powerbi/TROUBLESHOOTING.md` or `powerbi/README.md`
