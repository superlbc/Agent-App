# Power BI Dashboard Files

This folder contains the Power BI Desktop files (.pbix) that will be deployed to Power BI Service.

## Expected Files

Build these 3 files following [../BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md):

1. **MeetingNotesGenerator.pbix** - Meeting Notes Generator analytics dashboard
2. **EstimateCrafter.pbix** - EstimateCrafter analytics dashboard
3. **UnifiedAnalytics.pbix** - Unified cross-app analytics dashboard

## Build Instructions

See detailed step-by-step guide: [../BUILD-DASHBOARDS.md](../BUILD-DASHBOARDS.md)

Estimated time: ~1.5 hours total (30 minutes per dashboard)

## After Building

Once these files are created, run the automation:

```powershell
cd ..\scripts
.\deploy-all.ps1
```

The automation will:
- Find all .pbix files in this folder
- Deploy them to Power BI Service
- Configure permissions and refresh schedules
- Generate access links for stakeholders

## Git Note

These .pbix files are typically **not committed to git** due to large file size and binary format. Instead, commit:
- The DAX measure files (measures/*.dax)
- The build guide (BUILD-DASHBOARDS.md)
- The automation scripts (scripts/*.ps1)

This allows team members to rebuild dashboards from source rather than storing large binary files in version control.
