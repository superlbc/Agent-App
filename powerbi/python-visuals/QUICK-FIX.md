# Quick Fix: KeyError Issues

## Error: KeyError: 'UserEmail'

This error means the column name in the script doesn't match your actual data.

---

## 🔍 Step 1: Check What Columns You Have

1. **In Power BI, create a new Python visual**
2. **Select ALL fields** from `vw_MeetingNotesGenerator`:
   - Check all available fields in the Fields pane
   - Drag them to the Python visual
3. **Paste this diagnostic script**:

```python
import pandas as pd

df = dataset.copy()

print("AVAILABLE COLUMNS:")
print("="*60)
for i, col in enumerate(df.columns, 1):
    print(f"{i}. {col}")

print(f"\nTotal rows: {len(df)}")
```

4. **Click Run** (▶️)
5. **Look at the output** - it will show you the exact column names

---

## 🔧 Step 2: Use the Robust Script

Use the **v2 version** of the KPI cards script that handles column name variations automatically:

**File**: `01_kpi_cards_v2.py`

This version:
- ✅ Handles different column name casings (UserEmail, useremail, user_email)
- ✅ Handles missing columns gracefully (shows 0 instead of error)
- ✅ Works even if some fields aren't selected

---

## 🎯 Step 3: Select the Right Fields

When creating the Python visual, make sure to select these fields from the SQL view:

**Required fields for KPI Cards**:
- ☑️ `UserEmail` (or whatever your user column is called)
- ☑️ `EventType`
- ☑️ `EventID`
- ☑️ `TourAction` (if available)

**How to select**:
1. Insert → Python visual
2. In Fields pane (right side), expand `vw_MeetingNotesGenerator`
3. Check the boxes next to the fields above
4. Power BI will add them to the Python visual automatically

---

## 📋 Common Column Name Issues

### Issue: Column exists but different name

**Your SQL view might use different names**:
- Instead of `UserEmail` → might be `Email`, `User`, `user_email`
- Instead of `EventType` → might be `Type`, `event_type`

**Solution**: Use diagnostic script to see exact names, or use v2 script (auto-detects)

### Issue: Column not selected in Power BI

**Error appears even though column exists in SQL view**

**Solution**:
1. In Power BI, check the "Values" section of the Python visual
2. Make sure the field is listed there
3. If not, drag it from Fields pane

---

## ✅ Working Example

**Correct setup**:

1. **Python visual created**
2. **Fields selected** (in Values section):
   ```
   ✓ EventID
   ✓ EventType
   ✓ EventDate
   ✓ UserEmail
   ✓ SessionID
   ✓ TourAction
   ```
3. **Script pasted**: `01_kpi_cards_v2.py`
4. **Click Run**
5. **Visual appears** ✓

---

## 🆘 Still Getting Errors?

### Try the diagnostic script first:

**File**: `00_diagnostic.py`

This will show you:
- Exact column names in your dataset
- Data types
- Sample data
- Number of rows

**Then**:
- Compare column names to what the script expects
- Update script to use your actual column names
- Or use the v2 robust version

---

## 🔄 Alternative: Check Your SQL View

The column names come from your SQL view. Check:

```sql
SELECT * FROM vw_MeetingNotesGenerator
```

Look at the column names in the result. They should match what the Python script expects.

**Common differences**:
- SQL view uses `Email` but script expects `UserEmail`
- SQL view uses `Type` but script expects `EventType`
- Column casing differences (SQL is case-insensitive, Python is case-sensitive)

---

## 📝 Summary

**Quick fix**: Use `01_kpi_cards_v2.py` instead of `01_kpi_cards.py`

The v2 version automatically handles:
- ✅ Column name variations
- ✅ Missing columns
- ✅ Case sensitivity issues

**If still broken**: Run diagnostic script to see what columns you actually have.
