# ==============================================================================
# Power BI Python Visual: KPI Cards v2 (Robust) - Meeting Notes Generator
# ==============================================================================
# This version handles column name variations and missing columns gracefully
# Data source: vw_MeetingNotesGenerator
# ==============================================================================

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import pandas as pd
import numpy as np

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Helper function to find column by possible names
def find_column(df, possible_names):
    """Find column that matches one of the possible names (case-insensitive)"""
    df_columns_lower = {col.lower(): col for col in df.columns}
    for name in possible_names:
        if name.lower() in df_columns_lower:
            return df_columns_lower[name.lower()]
    return None

# Find column names (handles case variations)
user_col = find_column(df, ['UserEmail', 'useremail', 'user_email', 'Email', 'User'])
event_type_col = find_column(df, ['EventType', 'eventtype', 'event_type', 'Type'])
event_id_col = find_column(df, ['EventID', 'eventid', 'event_id', 'ID'])
tour_action_col = find_column(df, ['TourAction', 'touraction', 'tour_action', 'Action'])

# Calculate KPIs with error handling
try:
    if user_col:
        total_users = df[user_col].nunique()
    else:
        total_users = 0
except:
    total_users = 0

try:
    if event_type_col:
        notes_generated = len(df[df[event_type_col] == 'notesGenerated'])
    else:
        notes_generated = 0
except:
    notes_generated = 0

try:
    if event_type_col:
        total_exports = len(df[df[event_type_col].str.contains('Export', case=False, na=False)])
    else:
        total_exports = 0
except:
    total_exports = 0

# Calculate Tour Completion Rate
try:
    if tour_action_col:
        tours_started = len(df[df[tour_action_col] == 'started'])
        tours_completed = len(df[df[tour_action_col] == 'completed'])
        tour_completion_rate = (tours_completed / tours_started * 100) if tours_started > 0 else 0
    else:
        tour_completion_rate = 0
except:
    tour_completion_rate = 0

# Create figure with 4 subplots (2x2 grid)
fig, axes = plt.subplots(2, 2, figsize=(12, 6))
fig.patch.set_facecolor('white')

# Define colors
primary_color = '#0078D4'  # Microsoft Blue
success_color = '#107C10'  # Green
warning_color = '#FF8C00'  # Orange
info_color = '#5C2D91'     # Purple

kpis = [
    {
        'title': 'Total Users',
        'value': total_users,
        'color': primary_color,
        'suffix': '',
        'ax': axes[0, 0]
    },
    {
        'title': 'Notes Generated',
        'value': notes_generated,
        'color': success_color,
        'suffix': '',
        'ax': axes[0, 1]
    },
    {
        'title': 'Total Exports',
        'value': total_exports,
        'color': warning_color,
        'suffix': '',
        'ax': axes[1, 0]
    },
    {
        'title': 'Tour Completion',
        'value': tour_completion_rate,
        'color': info_color,
        'suffix': '%',
        'ax': axes[1, 1]
    }
]

# Create each KPI card
for kpi in kpis:
    ax = kpi['ax']
    ax.axis('off')

    # Draw card background
    card = mpatches.FancyBboxPatch(
        (0.1, 0.2), 0.8, 0.6,
        boxstyle="round,pad=0.05",
        facecolor='white',
        edgecolor=kpi['color'],
        linewidth=3
    )
    ax.add_patch(card)

    # Add title
    ax.text(0.5, 0.7, kpi['title'],
            ha='center', va='center',
            fontsize=12, fontweight='normal',
            color='#333333')

    # Add value
    value_text = f"{kpi['value']:,.0f}{kpi['suffix']}" if kpi['suffix'] != '%' else f"{kpi['value']:.1f}{kpi['suffix']}"
    ax.text(0.5, 0.4, value_text,
            ha='center', va='center',
            fontsize=32, fontweight='bold',
            color=kpi['color'])

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)

plt.tight_layout()
plt.show()
