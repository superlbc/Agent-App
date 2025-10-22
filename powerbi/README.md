# Power BI Telemetry Dashboards

Complete Power BI dashboard solution for Momo Analytics Platform (Meeting Notes Generator + EstimateCrafter).

## 📊 Overview

This directory contains everything needed to deploy professional telemetry dashboards:

- **3 Pre-Defined Dashboards** (Meeting Notes, EstimateCrafter, Unified)
- **50+ DAX Measures** (all calculations pre-written)
- **Dashboard Specifications** (visual-by-visual build guide)
- **Automation Scripts** (PowerShell deployment tools)
- **Configuration Templates** (easy setup)

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

1. **Power BI Desktop** (March 2023 or later)
   - Download: https://powerbi.microsoft.com/desktop/
   - Free download from Microsoft

2. **SQL Server Access**
   - Connection string to your telemetry database
   - Read access to views: `vw_MeetingNotesGenerator`, `vw_EstimateCrafter`, `vw_UnifiedAnalytics`

3. **Power BI Service License** (for publishing)
   - Power BI Pro OR
   - Premium Per User (PPU) OR
   - Premium Capacity workspace

---

## 📋 Setup Instructions

### Step 1: Configure SQL Connection

Edit `config/sql-connection.json`:

```json
{
  "server": "your-server.database.windows.net",
  "database": "TelemetryDB",
  "authentication": "SQL",
  "username": "your_username",
  "password": "your_password"
}
```

**Authentication Options:**
- `"SQL"` - SQL Server authentication (username/password)
- `"Windows"` - Windows integrated authentication
- `"AzureAD"` - Azure Active Directory

---

### Step 2: Create Your First Dashboard

#### Option A: Manual Creation (Recommended for First Time)

1. **Open Power BI Desktop**

2. **Get Data → SQL Server**
   ```
   Server: your-server.database.windows.net
   Database: TelemetryDB
   Data Connectivity mode: Import
   ```

3. **Load View**
   - For Meeting Notes: Select `vw_MeetingNotesGenerator`
   - For EstimateCrafter: Select `vw_EstimateCrafter`
   - For Unified: Select `vw_UnifiedAnalytics`

4. **Import DAX Measures**
   - Open `measures/meeting-notes-measures.dax`
   - Copy all measures
   - In Power BI Desktop: Modeling → New Measure
   - Paste each measure (or use Tabular Editor for bulk import)

5. **Build Visuals**
   - Follow specifications in `dashboards/meeting-notes-spec.md`
   - Or use the visual builder script (see Option B)

6. **Publish**
   - File → Publish
   - Select workspace
   - Share with stakeholders

#### Option B: Automated Deployment (After Building .pbix Files)

**One-time manual step:** Build the 3 .pbix files following [BUILD-DASHBOARDS.md](BUILD-DASHBOARDS.md) (~1.5 hours total)

**Then automate everything else:**

```powershell
# Deploy all dashboards to Power BI Service (fully automated)
cd powerbi/scripts
.\deploy-all.ps1
```

This automation handles:
- ✅ Workspace creation
- ✅ Dashboard deployment
- ✅ Permission configuration
- ✅ Refresh schedule setup
- ✅ Access link generation

**Or run steps individually:**
```powershell
.\1-create-workspace.ps1
.\2-deploy-dashboards.ps1
.\3-configure-permissions.ps1
.\4-configure-refresh.ps1
```

---

## ⚡ Automation Approach

**What CAN be automated (without paid tools):**
- ✅ Deploying .pbix files to Power BI Service
- ✅ Creating/configuring workspaces
- ✅ Setting up data refresh schedules
- ✅ Managing user permissions
- ✅ Sharing dashboards with stakeholders
- ✅ Generating embed codes for SharePoint

**What requires one-time manual work:**
- ⚠️ Building the 3 .pbix files (visuals cannot be created programmatically without paid tools)

**Our Solution: Hybrid Approach**
1. **Build .pbix files once** (~1.5 hours) following [BUILD-DASHBOARDS.md](BUILD-DASHBOARDS.md)
2. **Automate everything else** (2-3 minutes per deployment) using PowerShell scripts

After initial setup, all future deployments are fully automated!

---

## 📁 Directory Structure

```
powerbi/
├── README.md                           ← You are here
├── QUICKSTART.md                       ← 5-minute setup guide
├── BUILD-DASHBOARDS.md                 ← Step-by-step .pbix creation guide
├── TROUBLESHOOTING.md                  ← Common issues
│
├── dashboards/                         ← .pbix files (created by you)
│   ├── MeetingNotesGenerator.pbix      (build using guide)
│   ├── EstimateCrafter.pbix            (build using guide)
│   └── UnifiedAnalytics.pbix           (build using guide)
│
├── measures/                           ← DAX measure scripts
│   ├── meeting-notes-measures.dax      (60 measures, copy/paste)
│   ├── estimatecrafter-measures.dax    (75 measures, copy/paste)
│   └── unified-measures.dax            (80 measures, copy/paste)
│
├── scripts/                            ← PowerShell automation
│   ├── validate-connection.ps1         (test SQL connection)
│   ├── 1-create-workspace.ps1          (create Power BI workspace)
│   ├── 2-deploy-dashboards.ps1         (upload .pbix files)
│   ├── 3-configure-permissions.ps1     (add users, generate links)
│   ├── 4-configure-refresh.ps1         (schedule data refresh)
│   └── deploy-all.ps1                  (master script - runs all steps)
│
└── config/                             ← Configuration templates
    ├── sql-connection.json             (database connection)
    ├── deployment-config.json          (Power BI Service settings)
    ├── stakeholder-list.json           (viewer permissions)
    ├── workspace-info.json             (auto-generated)
    ├── deployment-info.json            (auto-generated)
    └── access-links.txt                (auto-generated)
```

---

## 📊 Dashboard Overview

### 1. Meeting Notes Generator Dashboard

**Purpose:** Track usage of Meeting Notes Generator app

**Data Source:** `vw_MeetingNotesGenerator`

**Pages:**
- **Page 1: Executive Overview** - KPIs, trends, event distribution
- **Page 2: Feature Adoption** - Presets, exports, user journey funnel
- **Page 3: User Behavior** - Heatmaps, engagement patterns, power users

**Key Metrics:**
- Total Events, Unique Users, Sessions
- Notes Generated/Regenerated
- Export Rate (PDF, Clipboard, Email, CSV)
- Tour Completion Rate
- Most Popular Presets
- Average Events Per Session

**Build Time:** ~30 minutes (following spec)

---

### 2. EstimateCrafter Dashboard

**Purpose:** Track usage of EstimateCrafter app

**Data Source:** `vw_EstimateCrafter`

**Pages:**
- **Page 1: Executive Overview** - Estimates, value trends, project stats
- **Page 2: Project Analytics** - Value by project, scenario usage, exports
- **Page 3: AI Insights** - VE adoption, savings analysis, chat usage

**Key Metrics:**
- Estimates Generated, Average Project Value
- VE Options Applied/Dismissed
- Missing Items Added
- Chat Message Volume
- Export Format Usage
- Scenario Creation Rate

**Build Time:** ~30 minutes (following spec)

---

### 3. Unified Analytics Dashboard

**Purpose:** Cross-app analysis and executive summary

**Data Source:** `vw_UnifiedAnalytics`

**Pages:**
- **Page 1: Cross-App Overview** - Portfolio metrics, app comparison
- **Page 2: Engagement Comparison** - Feature adoption across apps
- **Page 3: Top Users & Trends** - Power users, daily trends, time patterns

**Key Metrics:**
- Total Events (All Apps), Total Users
- Active Apps, Most Used App
- Export Rate (Cross-App)
- AI Adoption Rate (Cross-App)
- Power Users (5+ sessions)
- Average Session Duration

**Build Time:** ~20 minutes (following spec)

---

## 🔧 Helper Scripts

### Validate SQL Connection

Test your database connection before building dashboards:

```powershell
cd powerbi/scripts
.\validate-connection.ps1
```

**Output:**
```
✓ Connected to server: your-server.database.windows.net
✓ Database found: TelemetryDB
✓ View exists: vw_MeetingNotesGenerator (3,847 rows)
✓ View exists: vw_EstimateCrafter (1,234 rows)
✓ View exists: vw_UnifiedAnalytics (5,081 rows)

Connection Status: READY ✓
```

---

### Import DAX Measures (Bulk)

Requires [Tabular Editor](https://tabulareditor.com/) (free, open-source):

```powershell
cd powerbi/scripts
.\import-measures.ps1 -DashboardType "meeting-notes" -PBIXFile "C:\path\to\your\dashboard.pbix"
```

This script:
1. Opens your .pbix file
2. Imports all measures from `measures/meeting-notes-measures.dax`
3. Saves the file
4. Creates backup

**Without Tabular Editor:** Copy/paste measures manually from `.dax` files

---

## 🌐 Publishing to Power BI Service

### Manual Publishing (Current)

1. **Open dashboard in Power BI Desktop**
2. **File → Publish**
3. **Select destination workspace**
4. **Configure refresh:**
   - Settings → Datasets → Schedule refresh
   - Frequency: Daily at 6:00 AM
   - Time zone: Your timezone
5. **Share with stakeholders:**
   - Workspace → Access → Add people
   - Add emails with "Viewer" role

---

### Automated Publishing (Phase 2)

Coming soon - one command to:
- Create workspace
- Publish all dashboards
- Configure refresh
- Add stakeholder permissions
- Generate SharePoint embed links

```powershell
.\scripts\deployment\deploy-to-service.ps1 -ConfigFile "..\config\deployment-config.json"
```

---

## 📈 Data Refresh Strategy

### Option 1: Scheduled Refresh (Recommended)

**Setup:**
- Power BI Service → Dataset Settings → Scheduled Refresh
- Frequency: Daily at 6:00 AM (or hourly if Premium)
- Uses Power BI Gateway (on-premises) or direct Azure SQL

**Pros:**
- Automatic, hands-off
- Data fresh every morning
- No manual intervention

**Cons:**
- Requires Power BI Gateway (unless Azure SQL)
- Max 8 refreshes/day (Pro) or 48/day (Premium)

---

### Option 2: Manual Refresh

**In Power BI Desktop:**
- Home → Refresh

**In Power BI Service:**
- Dataset → ... → Refresh now

**Use when:**
- Testing/development
- One-off data updates
- Gateway not available yet

---

## 👥 User Permissions

### Roles

**Workspace Admin:**
- Full control over workspace
- Can publish/edit dashboards
- Manage permissions

**Workspace Member:**
- Can edit existing dashboards
- Can publish new content
- Cannot manage permissions

**Workspace Contributor:**
- Can edit existing content
- Cannot publish new content

**Workspace Viewer:**
- Read-only access to dashboards
- Cannot edit or publish
- **Recommended for stakeholders**

---

### Adding Stakeholders

#### Via Power BI Service (Manual)

1. Navigate to workspace
2. Click "Access" button
3. Add email addresses
4. Select "Viewer" role
5. Click "Add"

#### Via Script (Automated - Phase 2)

Edit `config/stakeholder-list.json`:

```json
{
  "viewers": [
    "executive1@company.com",
    "executive2@company.com",
    "manager1@company.com"
  ]
}
```

Run:
```powershell
.\scripts\deployment\manage-permissions.ps1 -Add -ConfigFile "..\config\stakeholder-list.json"
```

---

## 🔗 SharePoint Integration

### Embed Dashboard in SharePoint

1. **Get embed link:**
   - Power BI Service → Open dashboard
   - File → Embed → SharePoint Online
   - Copy iframe code

2. **Add to SharePoint page:**
   - Edit SharePoint page
   - Add "Embed" web part
   - Paste iframe code
   - Save page

### Automated Embed Code Generation (Phase 2)

```powershell
.\scripts\deployment\embed-in-sharepoint.ps1 -DashboardName "meeting-notes"
```

Output:
```html
<iframe width="100%" height="541.25"
  src="https://app.powerbi.com/reportEmbed?..."
  frameborder="0" allowFullScreen="true">
</iframe>
```

---

## 🛠️ Customization

### Modifying Visuals

1. Open dashboard in Power BI Desktop
2. Select visual to modify
3. Update:
   - **Visualizations pane** - Change visual type
   - **Fields pane** - Add/remove data fields
   - **Format pane** - Colors, fonts, labels
4. Save and republish

### Adding New Measures

1. Open appropriate `.dax` file in `measures/`
2. Add new measure:
   ```dax
   // Description of what this measures
   New Measure Name =
   CALCULATE(
       [Base Measure],
       FILTER(Table, Condition)
   )
   ```
3. Copy into Power BI Desktop: Modeling → New Measure
4. Save `.dax` file for future reference

### Adding New Visuals

Follow the pattern in dashboard specs:

```markdown
### Visual: [Name]
- Type: Card / Line Chart / Bar Chart / etc.
- Position: Row 1, Column 1
- Data: [Measure Name]
- Formatting: [Details]
```

---

## 🆘 Troubleshooting

### Connection Issues

**Error:** "Can't connect to SQL Server"

**Solutions:**
1. Verify server/database names
2. Check firewall rules (allow your IP)
3. Test credentials
4. Run `.\scripts\validate-connection.ps1`

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more.

---

### Missing Data

**Error:** "View not found" or "Empty dashboard"

**Solutions:**
1. Verify SQL views exist:
   ```sql
   SELECT * FROM vw_MeetingNotesGenerator
   SELECT * FROM vw_EstimateCrafter
   SELECT * FROM vw_UnifiedAnalytics
   ```
2. Check view permissions
3. Verify data in AppEvents table

---

### Refresh Failures

**Error:** Scheduled refresh fails in Power BI Service

**Solutions:**
1. Check gateway status (if on-premises SQL)
2. Update credentials in dataset settings
3. Verify firewall allows gateway IP
4. Check gateway logs

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more.

---

## 📚 Additional Resources

### Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [Dashboard Specifications](dashboards/) - Detailed visual build guides
- [SQL Views Documentation](../database/README.md) - Database schema reference
- [Telemetry.md](../Telemetry.md) - Complete telemetry framework docs

### External Links

- [Power BI Desktop Download](https://powerbi.microsoft.com/desktop/)
- [Power BI Documentation](https://docs.microsoft.com/power-bi/)
- [DAX Function Reference](https://dax.guide/)
- [Tabular Editor](https://tabulareditor.com/) (for bulk measure import)
- [Power BI Gateway](https://powerbi.microsoft.com/gateway/) (for on-premises SQL)

---

## 🔄 Update Process

### When SQL Views Change

1. Power BI Desktop: Home → Refresh
2. Verify visuals still work
3. Update measures if needed
4. Republish to Power BI Service

### When Adding New Apps

1. Create new view in SQL (following pattern)
2. Copy `measures/template.dax` → `measures/newapp-measures.dax`
3. Update measures for new app
4. Copy `dashboards/template-spec.md` → `dashboards/newapp-spec.md`
5. Build dashboard following spec
6. Publish to same workspace

---

## 🎯 Success Metrics

**Phase 1 Complete When:**
- [ ] All 3 dashboards built and published
- [ ] Data refreshes successfully
- [ ] Stakeholders can view dashboards
- [ ] All measures calculate correctly
- [ ] Visuals are properly formatted

**Phase 2 Complete When:**
- [ ] One-command deployment works
- [ ] Workspace created automatically
- [ ] Permissions set automatically
- [ ] Refresh configured automatically
- [ ] SharePoint embed works (if needed)

---

## 💬 Support

### Internal Support

- **IT/DevOps Team** - Dashboard deployment and infrastructure
- **Data Team** - SQL view changes and data quality
- **Product Teams** - Dashboard requirements and feature requests

### External Resources

- [Power BI Community](https://community.powerbi.com/)
- [DAX Patterns](https://www.daxpatterns.com/)
- [SQLBI](https://www.sqlbi.com/) - DAX and Power BI experts

---

## 📝 Version History

### v1.0.0 (2025-10-22) - Initial Release

**Included:**
- 3 dashboard specifications (Meeting Notes, EstimateCrafter, Unified)
- 50+ DAX measures across all dashboards
- SQL connection validation script
- Comprehensive documentation
- Configuration templates

**Phase 2 (Coming Soon):**
- Full automation scripts
- One-command deployment
- Workspace management
- Permission management
- SharePoint integration

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
**Maintained By:** IPCT Team
**Questions?** Contact: luis.bustos@momentumww.com
