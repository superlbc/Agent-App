# Python Visuals Troubleshooting Guide

## Error: "No module named 'matplotlib'"

This is the most common error when first using Python visuals in Power BI.

### Quick Fix

1. **Open Command Prompt as Administrator**
   - Press Windows key
   - Type "cmd"
   - Right-click "Command Prompt"
   - Select "Run as administrator"

2. **Install required packages**
   ```bash
   pip install matplotlib pandas numpy
   ```

3. **Wait for installation to complete** (may take 2-3 minutes)

4. **Restart Power BI Desktop** completely
   - Close all Power BI windows
   - Reopen Power BI Desktop

5. **Try the Python visual again**

---

## Verify Python Installation

### Step 1: Check Python is installed

```bash
python --version
```

Should show: `Python 3.8.x` or higher

If you get "command not found":
- **Install Python**: https://www.python.org/downloads/
- ✅ Check "Add Python to PATH" during installation

### Step 2: Check pip is working

```bash
pip --version
```

Should show: `pip 21.x.x` or higher

### Step 3: Check matplotlib is installed

```bash
pip show matplotlib
```

Should show package details. If not found, install it:
```bash
pip install matplotlib
```

### Step 4: Check pandas is installed

```bash
pip show pandas
```

If not found:
```bash
pip install pandas
```

### Step 5: Check numpy is installed

```bash
pip show numpy
```

If not found:
```bash
pip install numpy
```

---

## Configure Power BI to Use Python

### Step 1: Find Python installation path

**Option A: Check in Command Prompt**
```bash
python -c "import sys; print(sys.executable)"
```

This will show something like:
- `C:\Python38\python.exe`
- `C:\Users\luis.bustos\AppData\Local\Programs\Python\Python38\python.exe`

**Copy the folder path** (everything before `\python.exe`)

### Step 2: Configure Power BI

1. Open **Power BI Desktop**
2. Go to **File** → **Options and settings** → **Options**
3. Click **Python scripting** (under "Global" section)
4. Under "Python home directory":
   - Select "Other"
   - Click the folder icon
   - Browse to your Python installation folder (from Step 1)
   - Click **OK**
5. Click **OK** to save

### Step 3: Restart Power BI Desktop

Close and reopen Power BI completely.

---

## Still Not Working?

### Issue: Multiple Python installations

If you have multiple Python versions, Power BI might be using the wrong one.

**Solution: Specify exact Python path**

1. Find all Python installations:
   ```bash
   where python
   ```

2. For each path, check if matplotlib is installed:
   ```bash
   "C:\Python38\python.exe" -m pip show matplotlib
   ```

3. Install matplotlib in the specific Python version:
   ```bash
   "C:\Python38\python.exe" -m pip install matplotlib pandas numpy
   ```

4. Configure Power BI to use that specific Python path

### Issue: Corporate proxy/firewall

If `pip install` fails with network errors:

**Solution 1: Use proxy**
```bash
pip install --proxy http://proxy.company.com:8080 matplotlib pandas numpy
```

**Solution 2: Download offline**
1. Download wheels from: https://pypi.org/
   - matplotlib
   - pandas
   - numpy
2. Install from file:
   ```bash
   pip install C:\Downloads\matplotlib-*.whl
   pip install C:\Downloads\pandas-*.whl
   pip install C:\Downloads\numpy-*.whl
   ```

### Issue: Permission denied

**Solution: Install for user only**
```bash
pip install --user matplotlib pandas numpy
```

---

## Alternative: Simpler Python Visuals

If matplotlib is causing issues, here are simpler alternatives that use only pandas (smaller, easier to install):

### Simple KPI Cards (pandas only)

```python
import pandas as pd

# Calculate KPIs
df = dataset.copy()
total_users = df['UserEmail'].nunique()
notes_generated = len(df[df['EventType'] == 'notesGenerated'])
total_exports = len(df[df['EventType'].str.contains('Export', case=False, na=False)])

# Create summary dataframe
summary = pd.DataFrame({
    'Metric': ['Total Users', 'Notes Generated', 'Total Exports'],
    'Value': [total_users, notes_generated, total_exports]
})

print(summary)
```

This will display as a simple table instead of styled cards.

---

## Test Script

Use this simple script to test if Python is working in Power BI:

```python
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Test data
df = dataset.copy()

# Simple test plot
fig, ax = plt.subplots(figsize=(8, 4))
ax.text(0.5, 0.5, 'Python is working!',
        ha='center', va='center', fontsize=24)
ax.axis('off')
plt.show()
```

If this works, your Python setup is correct!

---

## Common Error Messages

### "Python runtime not found"
- **Cause**: Python not installed or not in PATH
- **Fix**: Install Python from python.org, check "Add to PATH"

### "Script took too long to execute"
- **Cause**: Too much data or complex script
- **Fix**: Filter data or simplify script

### "Can't display this visual"
- **Cause**: Script error or missing library
- **Fix**: Check error message details, install missing packages

### "Access denied" during pip install
- **Cause**: Administrator rights needed
- **Fix**: Run Command Prompt as Administrator

---

## Quick Setup Script (Windows)

Save this as `setup-python-powerbi.bat` and run as Administrator:

```batch
@echo off
echo Installing Python packages for Power BI...
python -m pip install --upgrade pip
pip install matplotlib pandas numpy
echo.
echo Installation complete!
echo Please restart Power BI Desktop.
pause
```

---

## Verification Checklist

Before trying Python visuals again:

- ✅ Python 3.8+ installed
- ✅ matplotlib installed (`pip show matplotlib` succeeds)
- ✅ pandas installed (`pip show pandas` succeeds)
- ✅ numpy installed (`pip show numpy` succeeds)
- ✅ Power BI configured with correct Python path
- ✅ Power BI Desktop restarted after configuration
- ✅ Test script runs successfully

---

## Get Help

If still not working:

1. **Share error message** - Copy full error text from Power BI
2. **Share Python version** - Run `python --version`
3. **Share pip list** - Run `pip list` to see all packages
4. **Share Power BI settings** - Screenshot of Python scripting options

---

## Alternative: Use Native Power BI Visuals Instead

If Python setup is too complex, consider using the **original approach**:
- Build dashboards manually in Power BI Desktop (~1.5 hours)
- Use native Power BI visuals (more interactive, no Python needed)
- Deploy with automation scripts

See: [../BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md)
