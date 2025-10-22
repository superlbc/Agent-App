# ==============================================================================
# Power BI Python Visual: Export Breakdown - Meeting Notes Generator
# ==============================================================================
# This script creates a pie chart showing export format distribution
# Data source: vw_MeetingNotesGenerator
# Required columns: EventType, ExportType
# ==============================================================================

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Power BI passes data as 'dataset' DataFrame
df = dataset.copy()

# Filter for export events
export_events = df[df['EventType'].str.contains('Export', case=False, na=False)]

# Count by export type
export_counts = export_events['EventType'].value_counts()

# Map event types to friendly names
export_type_mapping = {
    'pdfExport': 'PDF Export',
    'clipboardExport': 'Clipboard Export',
    'emailExport': 'Email Export',
    'csvExport': 'CSV Export',
    'docxExport': 'DOCX Export'
}

# Rename based on mapping
export_counts.index = export_counts.index.map(
    lambda x: export_type_mapping.get(x, x.replace('Export', ' Export').title())
)

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('white')

# Color palette
colors = ['#0078D4', '#107C10', '#FF8C00', '#5C2D91', '#008575']

# Create pie chart
wedges, texts, autotexts = ax.pie(
    export_counts.values,
    labels=export_counts.index,
    autopct='%1.1f%%',
    startangle=90,
    colors=colors[:len(export_counts)],
    pctdistance=0.85,
    explode=[0.05] * len(export_counts),  # Slightly separate all slices
    shadow=True
)

# Style the text
for text in texts:
    text.set_fontsize(12)
    text.set_fontweight('bold')

for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontsize(11)
    autotext.set_fontweight('bold')

# Add title
ax.set_title('Export Format Distribution', fontsize=16, fontweight='bold', pad=20)

# Add center circle for donut chart effect
centre_circle = plt.Circle((0, 0), 0.70, fc='white', linewidth=0)
ax.add_artist(centre_circle)

# Add total count in center
total_exports = export_counts.sum()
ax.text(0, 0, f'{total_exports:,}\nTotal\nExports',
       ha='center', va='center',
       fontsize=16, fontweight='bold',
       color='#333333')

# Equal aspect ratio ensures that pie is drawn as a circle
ax.axis('equal')

plt.tight_layout()
plt.show()
