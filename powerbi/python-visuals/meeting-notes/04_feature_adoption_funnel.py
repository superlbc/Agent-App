# ==============================================================================
# Power BI Python Visual: Feature Adoption Funnel - Meeting Notes Generator
# ==============================================================================
# This script creates a funnel chart showing user journey progression
# Data source: vw_MeetingNotesGenerator
# Required columns: EventType
# ==============================================================================

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from matplotlib.patches import Polygon

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Calculate funnel metrics
total_logins = len(df[df['EventType'] == 'userLogin'])
notes_generated = len(df[df['EventType'] == 'notesGenerated'])
total_exports = len(df[df['EventType'].str.contains('Export', case=False, na=False)])

# Funnel data
funnel_data = [
    {'stage': 'User Login', 'count': total_logins, 'color': '#0078D4'},
    {'stage': 'Notes Generated', 'count': notes_generated, 'color': '#107C10'},
    {'stage': 'Exported', 'count': total_exports, 'color': '#FF8C00'}
]

# Calculate conversion rates
for i in range(1, len(funnel_data)):
    if funnel_data[0]['count'] > 0:
        funnel_data[i]['conversion'] = (funnel_data[i]['count'] / funnel_data[0]['count']) * 100
    else:
        funnel_data[i]['conversion'] = 0

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('white')

# Funnel parameters
max_width = 0.8
min_width = 0.3
height = 0.2
y_start = 0.9

# Draw funnel segments
for idx, stage in enumerate(funnel_data):
    # Calculate width based on count
    if funnel_data[0]['count'] > 0:
        width = max_width * (stage['count'] / funnel_data[0]['count'])
        width = max(width, min_width)  # Ensure minimum visibility
    else:
        width = max_width

    # Calculate y position
    y = y_start - (idx * (height + 0.05))

    # Draw rectangle
    x = 0.5 - width / 2
    rect = plt.Rectangle((x, y), width, height,
                         facecolor=stage['color'],
                         edgecolor='white',
                         linewidth=2,
                         alpha=0.9)
    ax.add_patch(rect)

    # Add stage label
    ax.text(0.5, y + height/2, stage['stage'],
           ha='center', va='center',
           fontsize=14, fontweight='bold',
           color='white')

    # Add count
    ax.text(0.5, y + height/2 - 0.05, f"{stage['count']:,}",
           ha='center', va='center',
           fontsize=12,
           color='white')

    # Add conversion rate (skip first stage)
    if idx > 0 and 'conversion' in stage:
        ax.text(0.95, y + height/2, f"{stage['conversion']:.1f}%",
               ha='left', va='center',
               fontsize=11, fontweight='bold',
               color=stage['color'])

# Add connecting lines between stages
for idx in range(len(funnel_data) - 1):
    y1 = y_start - (idx * (height + 0.05))
    y2 = y_start - ((idx + 1) * (height + 0.05)) + height

    # Calculate widths
    if funnel_data[0]['count'] > 0:
        width1 = max_width * (funnel_data[idx]['count'] / funnel_data[0]['count'])
        width2 = max_width * (funnel_data[idx + 1]['count'] / funnel_data[0]['count'])
        width1 = max(width1, min_width)
        width2 = max(width2, min_width)
    else:
        width1 = width2 = max_width

    x1_left = 0.5 - width1 / 2
    x1_right = 0.5 + width1 / 2
    x2_left = 0.5 - width2 / 2
    x2_right = 0.5 + width2 / 2

    # Draw connecting trapezoid
    vertices = [
        [x1_left, y1],
        [x1_right, y1],
        [x2_right, y2],
        [x2_left, y2]
    ]
    poly = Polygon(vertices, facecolor='#CCCCCC', alpha=0.3, edgecolor='none')
    ax.add_patch(poly)

# Set limits and remove axes
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')

# Add title
ax.text(0.5, 0.98, 'Feature Adoption Funnel',
       ha='center', va='top',
       fontsize=16, fontweight='bold')

# Add subtitle
ax.text(0.5, 0.95, 'User Journey: Login → Generate → Export',
       ha='center', va='top',
       fontsize=11, color='#666666')

plt.tight_layout()
plt.show()
