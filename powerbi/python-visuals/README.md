# Power BI Python Visuals

This folder contains Python scripts for creating Power BI visuals programmatically.

## 📂 Structure

```
python-visuals/
├── README.md                          ← You are here
├── meeting-notes/                     ← Meeting Notes Generator visuals
│   ├── 01_kpi_cards.py               (4 KPI cards)
│   ├── 02_usage_over_time.py         (Line chart)
│   ├── 03_top_users_table.py         (Top users table)
│   ├── 04_feature_adoption_funnel.py (Funnel chart)
│   └── 05_export_breakdown.py        (Pie chart)
│
├── estimatecrafter/                   ← EstimateCrafter visuals (coming soon)
│   └── (to be created)
│
└── unified/                           ← Unified Analytics visuals (coming soon)
    └── (to be created)
```

## 🎯 Purpose

These Python scripts provide a **programmatic alternative** to manually creating Power BI visuals:

- ✅ **Scriptable** - Visuals defined as code
- ✅ **Version controllable** - Track in Git
- ✅ **Reproducible** - Same script = same visual
- ✅ **Customizable** - Full control over styling

## 🚀 Quick Start

1. **Install Python and libraries**
   ```bash
   pip install pandas matplotlib numpy
   ```

2. **Configure Power BI Desktop**
   - Options → Python scripting
   - Set Python home directory

3. **Use scripts in Power BI**
   - Insert → Python visual
   - Select required fields
   - Copy/paste script
   - Click Run

## 📖 Complete Guide

See detailed instructions: [../PYTHON-VISUALS-GUIDE.md](../PYTHON-VISUALS-GUIDE.md)

## 📊 Available Visuals

### Meeting Notes Generator (Page 1)

- **01_kpi_cards.py** - 4 KPI cards showing:
  - Total Users
  - Notes Generated
  - Total Exports
  - Tour Completion Rate

- **02_usage_over_time.py** - Line chart showing:
  - Events over time
  - Top 5 event types

- **03_top_users_table.py** - Table showing:
  - Top 10 users by activity
  - Total events, notes generated, exports per user

- **04_feature_adoption_funnel.py** - Funnel chart showing:
  - User journey: Login → Generate → Export
  - Conversion rates between stages

- **05_export_breakdown.py** - Pie/donut chart showing:
  - Distribution of export formats (PDF, Clipboard, Email, CSV)
  - Percentage breakdown

## 🔧 Requirements

### Python Environment
- Python 3.8 or higher
- Libraries: pandas, matplotlib, numpy

### Power BI Desktop
- Power BI Desktop (March 2023 or later)
- Python scripting enabled
- Python home directory configured

### Data Source
- SQL Server view: `vw_MeetingNotesGenerator`
- Required columns:
  - EventID
  - EventType
  - EventDate
  - UserEmail
  - SessionID
  - TourAction
  - ExportType

## 🎨 Customization

All scripts use consistent color schemes that can be customized:

```python
# Color variables in each script
primary_color = '#0078D4'  # Microsoft Blue
success_color = '#107C10'  # Green
warning_color = '#FF8C00'  # Orange
info_color = '#5C2D91'     # Purple
```

Change these to match your brand colors!

## ⚠️ Limitations

- **Not interactive** - Can't click to drill-down or filter
- **Slower performance** - Scripts run on each data refresh
- **No real-time refresh** - Only refresh during scheduled dataset refresh
- **Python required** - Python runtime must be installed

## 📈 When to Use Python Visuals

**Good for:**
- ✅ Scheduled reports (daily, weekly)
- ✅ Custom visualizations not available in Power BI
- ✅ Reports that need version control
- ✅ Automated dashboard generation

**Not ideal for:**
- ❌ Real-time dashboards
- ❌ Highly interactive reports
- ❌ Reports where users need drill-down capability

## 🆚 Comparison to Native Power BI Visuals

See comparison table in: [../PYTHON-VISUALS-GUIDE.md](../PYTHON-VISUALS-GUIDE.md#-comparison-python-vs-native-visuals)

## 🚀 Deployment

1. **Create .pbix file with Python visuals**
   - Use scripts from this folder
   - Save to: `../dashboards/MeetingNotesGenerator-Python.pbix`

2. **Deploy using automation**
   ```powershell
   cd ../scripts
   .\2-deploy-dashboards.ps1
   ```

## 📞 Support

- **Complete guide:** [../PYTHON-VISUALS-GUIDE.md](../PYTHON-VISUALS-GUIDE.md)
- **Troubleshooting:** See guide's troubleshooting section
- **Customization:** See guide's customization section

## 🔄 Status

**Completed:**
- ✅ Meeting Notes Generator - Page 1 (5 visuals)

**Planned:**
- ⏳ Meeting Notes Generator - Page 2 (Feature Adoption)
- ⏳ Meeting Notes Generator - Page 3 (User Behavior)
- ⏳ EstimateCrafter - All pages
- ⏳ Unified Analytics - All pages

Create these on request!
