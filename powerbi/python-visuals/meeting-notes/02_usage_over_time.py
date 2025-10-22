# ==============================================================================
# Power BI Python Visual: Usage Over Time - Meeting Notes Generator
# ==============================================================================
# This script creates a line chart showing events over time by event type
# Data source: vw_MeetingNotesGenerator
# Required columns: EventDate, EventType
# ==============================================================================

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from datetime import datetime

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Convert EventDate to datetime if it's not already
df['EventDate'] = pd.to_datetime(df['EventDate'])

# Group by date and event type
daily_events = df.groupby([df['EventDate'].dt.date, 'EventType']).size().reset_index(name='Count')
daily_events['EventDate'] = pd.to_datetime(daily_events['EventDate'])

# Get top 5 most common event types for cleaner visualization
top_events = df['EventType'].value_counts().head(5).index.tolist()

# Create figure
fig, ax = plt.subplots(figsize=(14, 6))
fig.patch.set_facecolor('white')

# Color palette
colors = ['#0078D4', '#107C10', '#FF8C00', '#5C2D91', '#008575']

# Plot line for each event type
for idx, event_type in enumerate(top_events):
    event_data = daily_events[daily_events['EventType'] == event_type]
    if not event_data.empty:
        ax.plot(event_data['EventDate'], event_data['Count'],
                marker='o', linewidth=2.5, markersize=6,
                label=event_type, color=colors[idx % len(colors)],
                alpha=0.9)

# Formatting
ax.set_xlabel('Date', fontsize=12, fontweight='bold')
ax.set_ylabel('Event Count', fontsize=12, fontweight='bold')
ax.set_title('Usage Over Time - Top Event Types', fontsize=16, fontweight='bold', pad=20)

# Grid
ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.5)
ax.set_facecolor('#F5F5F5')

# Legend
ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, fontsize=10)

# Rotate x-axis labels
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.show()
