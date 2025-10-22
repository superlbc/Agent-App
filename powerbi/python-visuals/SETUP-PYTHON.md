# Python Setup for Power BI - Complete Guide

## Error: "pip is not recognized"

This means Python is not installed or not added to your system PATH.

---

## 🐍 Install Python (15 minutes)

### Step 1: Download Python

1. **Go to**: https://www.python.org/downloads/
2. **Click**: "Download Python 3.12.x" (latest stable version)
3. **Wait** for download to complete

### Step 2: Install Python

1. **Run** the downloaded installer (`python-3.12.x.exe`)

2. **⚠️ IMPORTANT**: Check these boxes:
   - ✅ **"Add python.exe to PATH"** ← This is critical!
   - ✅ "Install pip"

   ![Screenshot placeholder: Shows installer with "Add to PATH" checkbox]

3. **Click** "Install Now"

4. **Wait** for installation (2-3 minutes)

5. **Click** "Close" when done

### Step 3: Verify Installation

1. **Close any open Command Prompt windows** (old ones won't have the new PATH)

2. **Open NEW Command Prompt** (not as admin, just regular)

3. **Type**:
   ```bash
   python --version
   ```

   Should show: `Python 3.12.x`

4. **Type**:
   ```bash
   pip --version
   ```

   Should show: `pip 23.x.x`

If both commands work, Python is installed correctly! ✅

---

## 📦 Install Required Packages

Now that Python is installed, install the packages:

```bash
pip install matplotlib pandas numpy
```

This will take 2-3 minutes. You'll see progress bars.

When complete, verify:
```bash
pip show matplotlib
pip show pandas
pip show numpy
```

All three should show package details.

---

## 🔧 Configure Power BI Desktop

### Step 1: Find Python Location

```bash
python -c "import sys; print(sys.executable)"
```

This shows something like:
```
C:\Users\luis.bustos\AppData\Local\Programs\Python\Python312\python.exe
```

**Copy the folder path** (everything before `\python.exe`):
```
C:\Users\luis.bustos\AppData\Local\Programs\Python\Python312
```

### Step 2: Configure Power BI

1. **Open Power BI Desktop**
2. **File** → **Options and settings** → **Options**
3. **Python scripting** (in left panel)
4. **Detected Python home directories**:
   - If your Python path appears in dropdown: **Select it**
   - If not: Select **"Other"** and browse to the path from Step 1
5. **Click OK**

### Step 3: Restart Power BI

**Close Power BI Desktop completely** and reopen it.

---

## ✅ Test Python in Power BI

1. **Open your Power BI report** with `vw_MeetingNotesGenerator` data
2. **Insert** → **Python visual**
3. **Select fields**: EventID, EventType, UserEmail
4. **Paste this test script**:

```python
import pandas as pd
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 4))
ax.text(0.5, 0.5, 'Python is working! ✓',
        ha='center', va='center', fontsize=24, color='green')
ax.axis('off')
plt.show()
```

5. **Click Run** (▶️)

If you see "Python is working! ✓", you're all set! 🎉

---

## 🚫 If Python Path Issues Persist

### Option A: Install for All Users

Sometimes "Add to PATH" doesn't work. Manually add it:

1. **Press** Windows key, type "environment variables"
2. **Click** "Edit the system environment variables"
3. **Click** "Environment Variables" button
4. **Under "System variables"**, find "Path"
5. **Click** "Edit"
6. **Click** "New"
7. **Add** these two paths (use your actual Python location):
   ```
   C:\Users\luis.bustos\AppData\Local\Programs\Python\Python312
   C:\Users\luis.bustos\AppData\Local\Programs\Python\Python312\Scripts
   ```
8. **Click** OK on all dialogs
9. **Restart** your computer (or at least close all terminals)

### Option B: Use Full Path

Instead of `pip`, use the full path:

```bash
C:\Users\luis.bustos\AppData\Local\Programs\Python\Python312\python.exe -m pip install matplotlib pandas numpy
```

(Replace with your actual Python path)

---

## 🏢 Corporate Environment Issues

### Issue: Admin Rights Required

If you can't install Python system-wide:

1. **Download Python installer**
2. **Run installer**
3. **Choose**: "Install for current user only" (doesn't need admin)
4. **Check**: "Add to PATH"
5. **Install**

### Issue: Company Blocks Python Installation

Contact your IT department:
- Request Python 3.8+ installation
- Request packages: matplotlib, pandas, numpy
- Share this guide with them

Or use **Option C** below (no Python needed).

---

## ⚡ Option C: Skip Python - Use Native Power BI Visuals

If Python setup is too complex or blocked by IT, use the **original approach**:

### What You Get:
- ✅ More interactive dashboards (drill-down, filtering)
- ✅ Faster performance
- ✅ Real-time refresh
- ✅ No Python installation needed
- ✅ 215 pre-written DAX measures (copy/paste)
- ✅ Detailed build guide

### What You Do:
1. Build 3 dashboards manually in Power BI Desktop (~1.5 hours)
2. Use automation to deploy everything else (~3 minutes)

**Guide**: [../BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md)

**Benefits**:
- Standard Power BI approach (IT-approved)
- Native visuals work better in Power BI Service
- Easier for stakeholders to use
- Better performance

---

## 📊 Python vs Native: Quick Comparison

| Aspect | Python Visuals | Native Visuals |
|--------|---------------|----------------|
| **Setup Time** | 30 min (install Python) | 0 min |
| **Build Time** | 30 min (copy/paste scripts) | 1.5 hours (build visuals) |
| **IT Approval** | May need approval | Already approved |
| **Interactivity** | None | Full drill-down |
| **Performance** | Slower | Fast |
| **Version Control** | Yes (code files) | No |
| **Automation** | Partial | Deployment only |

---

## 🎯 Recommendation

Given that `pip` is not recognized:

### Path 1: Install Python (If You Have Time)
- Follow steps above
- Takes 30 minutes total
- Enables Python visual approach

### Path 2: Skip Python (Faster to Production)
- Use native Power BI visuals
- Follow [BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md)
- More reliable, better performance
- Standard approach (no special setup)

**My recommendation**: **Path 2** (native visuals) is more practical for production dashboards, especially in corporate environments. Python visuals are great for experimentation but native visuals are better for end users.

---

## 🆘 Need Help?

**If you want Python approach:**
- Share screenshot of Python installer
- Or request IT to install Python

**If you want native visual approach:**
- Skip to [BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md)
- I can help build the dashboards step-by-step

Which path do you want to take?
