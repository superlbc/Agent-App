# ==============================================================================
# Power BI Python Visual: Diagnostic Script
# ==============================================================================
# Use this script to see what columns are available in your dataset
# This helps debug KeyError issues
# ==============================================================================

import pandas as pd

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Display column names
print("="*60)
print("AVAILABLE COLUMNS IN YOUR DATASET:")
print("="*60)
for i, col in enumerate(df.columns, 1):
    print(f"{i}. {col}")

print("\n" + "="*60)
print("DATA TYPES:")
print("="*60)
print(df.dtypes)

print("\n" + "="*60)
print("FIRST 5 ROWS:")
print("="*60)
print(df.head())

print("\n" + "="*60)
print("DATASET SHAPE:")
print("="*60)
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
