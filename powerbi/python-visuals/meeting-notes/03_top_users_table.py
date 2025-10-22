# ==============================================================================
# Power BI Python Visual: Top Users Table - Meeting Notes Generator
# ==============================================================================
# This script creates a table showing top users and their activity metrics
# Data source: vw_MeetingNotesGenerator
# Required columns: UserEmail, EventType
# ==============================================================================

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Calculate metrics per user
user_metrics = df.groupby('UserEmail').agg({
    'EventID': 'count',  # Total Events
}).rename(columns={'EventID': 'Total Events'})

# Notes Generated per user
notes_generated = df[df['EventType'] == 'notesGenerated'].groupby('UserEmail').size()
user_metrics['Notes Generated'] = notes_generated

# Total Exports per user
exports = df[df['EventType'].str.contains('Export', case=False, na=False)].groupby('UserEmail').size()
user_metrics['Total Exports'] = exports

# Fill NaN with 0
user_metrics = user_metrics.fillna(0).astype(int)

# Sort by total events and get top 10
user_metrics = user_metrics.sort_values('Total Events', ascending=False).head(10)

# Reset index to get UserEmail as column
user_metrics = user_metrics.reset_index()

# Shorten email addresses for display (keep only name before @)
user_metrics['User'] = user_metrics['UserEmail'].apply(lambda x: x.split('@')[0] if '@' in x else x)
user_metrics = user_metrics[['User', 'Total Events', 'Notes Generated', 'Total Exports']]

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('white')
ax.axis('tight')
ax.axis('off')

# Create table
table = ax.table(
    cellText=user_metrics.values,
    colLabels=user_metrics.columns,
    cellLoc='center',
    loc='center',
    colColours=['#0078D4'] * len(user_metrics.columns)
)

# Style the table
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 2.5)

# Header styling
for i in range(len(user_metrics.columns)):
    cell = table[(0, i)]
    cell.set_text_props(weight='bold', color='white', fontsize=12)
    cell.set_facecolor('#0078D4')

# Alternate row colors
for i in range(1, len(user_metrics) + 1):
    for j in range(len(user_metrics.columns)):
        cell = table[(i, j)]
        if i % 2 == 0:
            cell.set_facecolor('#F0F0F0')
        else:
            cell.set_facecolor('white')

        # Right-align numbers
        if j > 0:
            cell.set_text_props(ha='right')

# Add title
ax.set_title('Top 10 Users by Activity', fontsize=16, fontweight='bold', pad=20)

plt.tight_layout()
plt.show()
