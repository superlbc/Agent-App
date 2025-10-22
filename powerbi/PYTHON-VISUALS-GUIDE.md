# Power BI Python Visuals - Complete Guide

## 🎯 Why Python Visuals?

You asked: **"Can you generate Python or R visuals for these elements?"**

**Answer: YES!** This is actually a **programmatic way** to create Power BI visuals!

### Advantages
- ✅ **Fully Scriptable** - Visuals defined as code (text files)
- ✅ **Version Controllable** - Track changes in Git
- ✅ **Programmatically Deployable** - Can be automated
- ✅ **Reproducible** - Same script = same visual every time
- ✅ **Customizable** - Full control over styling and behavior
- ✅ **No Paid Tools Required** - Free Python libraries

### Limitations
- ⚠️ **No Interactivity** - Can't click/drill-down like native Power BI visuals
- ⚠️ **Slower Performance** - Python scripts run on each refresh
- ⚠️ **Service Limitations** - Python visuals don't auto-refresh in Power BI Service (scheduled refresh only)
- ⚠️ **Python Setup Required** - Python runtime must be installed

---

## 📦 What We Created

### Page 1: Meeting Notes Generator Dashboard

**5 Python Visual Scripts:**
1. **01_kpi_cards.py** - 4 KPI cards (Users, Notes, Exports, Tour Completion)
2. **02_usage_over_time.py** - Line chart showing events over time
3. **03_top_users_table.py** - Table of top 10 users by activity
4. **04_feature_adoption_funnel.py** - Funnel showing user journey
5. **05_export_breakdown.py** - Pie/donut chart of export formats

---

## 🛠️ Setup Instructions

### Step 1: Install Python (One-Time Setup)

1. **Download Python 3.8+**
   - Visit: https://www.python.org/downloads/
   - Download Python 3.8 or later
   - ✅ Check "Add Python to PATH" during installation

2. **Install Required Libraries**
   ```bash
   pip install pandas matplotlib numpy
   ```

3. **Verify Installation**
   ```bash
   python --version
   # Should show: Python 3.8.x or higher
   ```

### Step 2: Configure Power BI Desktop

1. **Open Power BI Desktop**

2. **Enable Python Scripting**
   - File → Options and Settings → Options
   - Python scripting section
   - Set "Python home directory" to your Python installation
     - Example: `C:\Python38\` or `C:\Users\YourName\AppData\Local\Programs\Python\Python38\`
   - Set "Python IDE" (optional, for editing scripts)

3. **Test Python Integration**
   - Insert → Python visual
   - If prompted, click "Enable" to allow Python scripts

---

## 📊 How to Use Python Visuals

### Method 1: Copy/Paste Scripts (Recommended)

#### For Each Visual:

1. **Insert Python Visual**
   - Click "Visualizations" pane
   - Select Python visual icon (looks like Python logo)
   - A script editor will appear at bottom

2. **Select Data Fields**
   - Power BI will ask you to select fields
   - For Meeting Notes visuals, select these fields from `vw_MeetingNotesGenerator`:
     - `EventID`
     - `EventType`
     - `EventDate`
     - `UserEmail`
     - `SessionID`
     - `TourAction`
     - `ExportType`

3. **Paste Python Script**
   - Open the corresponding `.py` file from `powerbi/python-visuals/meeting-notes/`
   - Copy the entire script
   - Paste into the Python script editor in Power BI
   - Click the "Run" button (▶️ icon)

4. **Visual Appears**
   - The script runs and generates the visualization
   - Adjust size/position as needed

#### Example for KPI Cards:

```
1. Insert → Python visual
2. Select fields: EventID, EventType, EventDate, UserEmail, SessionID, TourAction
3. Open: python-visuals/meeting-notes/01_kpi_cards.py
4. Copy entire script
5. Paste into Power BI Python script editor
6. Click Run (▶️)
7. KPI cards appear!
```

### Method 2: Load from File (Advanced)

You can load scripts from files using Python's `exec()` function:

```python
# In Power BI Python visual, use this:
with open(r'C:\path\to\powerbi\python-visuals\meeting-notes\01_kpi_cards.py', 'r') as f:
    exec(f.read())
```

**Note:** Change path to your actual file location.

---

## 🎨 Building Page 1 Dashboard

Follow these steps to create Page 1 of Meeting Notes Generator dashboard using Python visuals:

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Meeting Notes Generator Analytics - Page 1        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  KPI CARDS (01_kpi_cards.py)                │  │
│  │  [Users] [Notes] [Exports] [Tour %]         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  USAGE OVER TIME (02_usage_over_time.py)    │  │
│  │  Line chart: Events by date and type        │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────┐  ┌──────────────────────┐  │
│  │  TOP USERS        │  │  EXPORT BREAKDOWN    │  │
│  │  (03_top_users    │  │  (05_export_         │  │
│  │   _table.py)      │  │   breakdown.py)      │  │
│  │  Table of top 10  │  │  Pie chart           │  │
│  └───────────────────┘  └──────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  FEATURE ADOPTION FUNNEL                    │  │
│  │  (04_feature_adoption_funnel.py)            │  │
│  │  Login → Generate → Export                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step-by-Step Build (30 minutes)

1. **Create New Power BI Report** (2 min)
   - Open Power BI Desktop
   - Get Data → SQL Server
   - Connect to: `vw_MeetingNotesGenerator`
   - Load data

2. **Add KPI Cards** (5 min)
   - Insert → Python visual
   - Select fields: EventID, EventType, EventDate, UserEmail, SessionID, TourAction
   - Paste script from `01_kpi_cards.py`
   - Click Run
   - Resize to full width, top of page

3. **Add Usage Over Time Chart** (5 min)
   - Insert → Python visual
   - Select fields: EventDate, EventType
   - Paste script from `02_usage_over_time.py`
   - Click Run
   - Resize to full width, below KPI cards

4. **Add Top Users Table** (5 min)
   - Insert → Python visual
   - Select fields: UserEmail, EventType, EventID
   - Paste script from `03_top_users_table.py`
   - Click Run
   - Resize to left half, middle section

5. **Add Export Breakdown Pie Chart** (5 min)
   - Insert → Python visual
   - Select fields: EventType, ExportType
   - Paste script from `05_export_breakdown.py`
   - Click Run
   - Resize to right half, middle section

6. **Add Feature Adoption Funnel** (5 min)
   - Insert → Python visual
   - Select fields: EventType
   - Paste script from `04_feature_adoption_funnel.py`
   - Click Run
   - Resize to full width, bottom of page

7. **Format and Save** (3 min)
   - Adjust visual sizes and positions
   - Add page title: "Overview Dashboard"
   - File → Save As: `MeetingNotesGenerator-Python.pbix`

---

## 🔄 Data Refresh Behavior

### Power BI Desktop
- ✅ Python visuals refresh automatically when data changes
- ✅ Click "Refresh" button to re-run scripts

### Power BI Service (Online)
- ⚠️ Python visuals **do NOT** support real-time refresh
- ✅ They refresh during **scheduled dataset refresh**
- Configure refresh schedule: Daily, Weekly, etc.

### Recommendation
For real-time dashboards, use native Power BI visuals. For automated/scheduled reports, Python visuals work great!

---

## 🎨 Customization

### Change Colors

Edit the color variables in each script:

```python
# Example from 01_kpi_cards.py
primary_color = '#0078D4'  # Change to your brand color
success_color = '#107C10'  # Change to your brand color
warning_color = '#FF8C00'  # Change to your brand color
info_color = '#5C2D91'     # Change to your brand color
```

### Change Fonts

```python
# Change fontsize in any script
ax.text(0.5, 0.7, 'Title',
       fontsize=16,        # ← Change this
       fontweight='bold')
```

### Add Logo

```python
# Add this to any script
from matplotlib.image import imread

logo = imread('path/to/your/logo.png')
ax.imshow(logo, extent=[0.85, 0.95, 0.90, 1.0])
```

---

## 🐛 Troubleshooting

### Error: "Python runtime not found"
**Solution:** Install Python 3.8+ and configure path in Power BI Options

### Error: "ModuleNotFoundError: No module named 'matplotlib'"
**Solution:**
```bash
pip install matplotlib pandas numpy
```

### Error: "Script took too long to execute"
**Solution:** Reduce data size or simplify visualization logic

### Visual Not Appearing
**Solution:**
1. Check that all required fields are selected
2. Verify data exists in dataset
3. Look for errors in script editor
4. Try clicking "Run" button again

### Colors Look Different
**Solution:** Power BI Service may render colors slightly differently. Test in Service after publishing.

---

## 📈 Performance Tips

1. **Filter Data Early**
   ```python
   # Filter before processing
   df = dataset[dataset['EventDate'] > '2024-01-01'].copy()
   ```

2. **Aggregate Before Plotting**
   ```python
   # Aggregate first, then plot
   daily_events = df.groupby('EventDate').size()
   ```

3. **Limit Data Points**
   ```python
   # Top 10 only
   top_users = user_metrics.head(10)
   ```

4. **Use Efficient Libraries**
   - matplotlib is faster than seaborn for simple charts
   - pandas is faster than numpy for aggregations

---

## 🚀 Deployment

### Save and Publish

1. **Save .pbix File**
   - File → Save As
   - Save to: `powerbi/dashboards/MeetingNotesGenerator-Python.pbix`

2. **Publish to Power BI Service**
   - File → Publish → Select workspace
   - Choose: "Momo Analytics" workspace

3. **Configure Python in Service**
   - Go to Power BI Admin Portal
   - Tenant settings → Python visuals
   - Enable for your workspace

4. **Schedule Refresh**
   - In Power BI Service, go to Dataset settings
   - Schedule refresh → Daily at 6:00 AM
   - Python visuals will refresh with data

---

## 🔧 Automation with Python Visuals

### Can This Be Fully Automated?

**Partially Yes!**

**What can be automated:**
- ✅ Python script creation (already done - text files)
- ✅ Script deployment (copy scripts to shared location)
- ✅ Data refresh (scheduled refresh)

**What still requires manual work:**
- ⚠️ Initial visual creation in Power BI Desktop (paste scripts once)
- ⚠️ Layout and positioning of visuals
- ⚠️ Publishing to Power BI Service (first time)

**Workflow:**
1. **Manual (once):** Create .pbix file with Python visuals (30 min)
2. **Automated:** Deploy using existing scripts:
   ```powershell
   cd powerbi\scripts
   .\2-deploy-dashboards.ps1
   ```

---

## 🆚 Comparison: Python vs Native Visuals

| Feature | Python Visuals | Native Power BI Visuals |
|---------|---------------|------------------------|
| **Scriptable** | ✅ Yes | ❌ No |
| **Version Control** | ✅ Yes | ❌ No |
| **Fully Automated** | ⚠️ Partially | ❌ No |
| **Interactive** | ❌ No | ✅ Yes |
| **Performance** | ⚠️ Slower | ✅ Fast |
| **Real-time Refresh** | ❌ No | ✅ Yes |
| **Custom Styling** | ✅ Full control | ⚠️ Limited |
| **Setup Required** | ⚠️ Python install | ✅ None |
| **Cost** | ✅ Free | ✅ Free |

---

## 🎓 Next Steps

### To Test This Approach:

1. **Install Python** (15 min)
   ```bash
   python --version
   pip install pandas matplotlib numpy
   ```

2. **Configure Power BI** (5 min)
   - Set Python home directory
   - Enable Python visuals

3. **Build Page 1** (30 min)
   - Follow step-by-step guide above
   - Use provided Python scripts

4. **Evaluate Results**
   - Does this meet your needs?
   - Are visuals acceptable?
   - Is performance OK?

5. **Decide Approach**
   - **Option A:** Continue with Python visuals for all pages
   - **Option B:** Hybrid (Python for some, native for others)
   - **Option C:** Use original approach (native visuals, automated deployment)

### To Create Remaining Pages:

If Python approach works well for Page 1, I can create:
- Page 2 scripts (Feature Adoption, Presets, Interrogate)
- Page 3 scripts (User Behavior, Engagement Patterns)
- EstimateCrafter dashboard scripts (all 3 pages)
- Unified Analytics dashboard scripts (all 3 pages)

---

## 📞 Support

- **Python Issues:** Check Python installation and library versions
- **Power BI Issues:** Ensure Python scripting is enabled
- **Script Errors:** Check field names match your SQL view columns
- **Performance:** Try reducing data size or simplifying visuals

---

## 💡 Summary

**You asked:** "Can you generate Python or R visuals?"

**Answer:** YES! I created 5 Python scripts for Page 1 that:
- Generate KPI cards, charts, tables, and funnels
- Are fully scriptable (text files in Git)
- Can be copied/pasted into Power BI Desktop
- Provide a programmatic alternative to manual visual creation

**Trade-off:**
- More scriptable and version-controllable
- But less interactive than native Power BI visuals
- Still requires one-time setup in Power BI Desktop

**Next Step:** Test these 5 scripts to see if this approach works for your needs!
