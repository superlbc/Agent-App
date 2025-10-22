# ==============================================================================
# deploy-all.ps1
# Master deployment script - Runs complete Power BI deployment automation
# ==============================================================================

param(
    [switch]$SkipWorkspace,
    [switch]$SkipDeploy,
    [switch]$SkipPermissions,
    [switch]$SkipRefresh
)

$ErrorActionPreference = "Stop"

# Script configuration
$scriptPath = $PSScriptRoot
$scripts = @(
    @{ Name = "Workspace Creation"; Script = "1-create-workspace.ps1"; Skip = $SkipWorkspace },
    @{ Name = "Dashboard Deployment"; Script = "2-deploy-dashboards.ps1"; Skip = $SkipDeploy },
    @{ Name = "Permission Configuration"; Script = "3-configure-permissions.ps1"; Skip = $SkipPermissions },
    @{ Name = "Refresh Configuration"; Script = "4-configure-refresh.ps1"; Skip = $SkipRefresh }
)

# Display banner
Clear-Host
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║        Momo Analytics Platform                             ║" -ForegroundColor Cyan
Write-Host "║        Power BI Deployment Automation                      ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Pre-flight checks
Write-Host "Pre-Flight Checks" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check PowerShell version
Write-Host "  Checking PowerShell version..." -ForegroundColor Gray
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "    ❌ PowerShell 5.0 or higher required" -ForegroundColor Red
    Write-Host "    Current version: $($PSVersionTable.PSVersion)" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ PowerShell $($PSVersionTable.PSVersion)" -ForegroundColor Green

# Check for Power BI module
Write-Host "  Checking Power BI module..." -ForegroundColor Gray
if (-not (Get-Module -ListAvailable -Name MicrosoftPowerBIMgmt)) {
    Write-Host "    ⚠ MicrosoftPowerBIMgmt module not found" -ForegroundColor Yellow
    Write-Host "    Installing module..." -ForegroundColor Gray
    Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser -Force -AllowClobber
    Write-Host "    ✓ Module installed" -ForegroundColor Green
} else {
    Write-Host "    ✓ Module available" -ForegroundColor Green
}

# Check configuration files
Write-Host "  Checking configuration files..." -ForegroundColor Gray
$configFiles = @(
    "..\config\deployment-config.json",
    "..\config\sql-connection.json",
    "..\config\stakeholder-list.json"
)

$missingConfigs = @()
foreach ($configFile in $configFiles) {
    $fullPath = Join-Path $scriptPath $configFile
    if (-not (Test-Path $fullPath)) {
        $missingConfigs += $configFile
    }
}

if ($missingConfigs.Count -gt 0) {
    Write-Host "    ❌ Missing configuration files:" -ForegroundColor Red
    foreach ($missing in $missingConfigs) {
        Write-Host "       - $missing" -ForegroundColor Red
    }
    Write-Host "`n  Please create these files from the templates in powerbi\config\" -ForegroundColor Yellow
    exit 1
}
Write-Host "    ✓ All configuration files present" -ForegroundColor Green

# Check for .pbix files
Write-Host "  Checking for dashboard files..." -ForegroundColor Gray
$pbixFolder = Join-Path $scriptPath "..\dashboards"
if (-not (Test-Path $pbixFolder)) {
    Write-Host "    ⚠ Dashboards folder not found: $pbixFolder" -ForegroundColor Yellow
    Write-Host "    Creating folder..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $pbixFolder | Out-Null
}

$pbixFiles = Get-ChildItem -Path $pbixFolder -Filter "*.pbix" -ErrorAction SilentlyContinue

if ($pbixFiles.Count -eq 0 -and -not $SkipDeploy) {
    Write-Host "    ⚠ No .pbix files found" -ForegroundColor Yellow
    Write-Host "`n  Expected files:" -ForegroundColor Yellow
    Write-Host "    - MeetingNotesGenerator.pbix" -ForegroundColor Gray
    Write-Host "    - EstimateCrafter.pbix" -ForegroundColor Gray
    Write-Host "    - UnifiedAnalytics.pbix" -ForegroundColor Gray
    Write-Host "`n  Please build the dashboards first using:" -ForegroundColor Yellow
    Write-Host "    powerbi\BUILD-DASHBOARDS.md" -ForegroundColor Gray
    Write-Host "`n  Or skip deployment with: -SkipDeploy" -ForegroundColor Gray
    exit 1
} elseif ($pbixFiles.Count -gt 0) {
    Write-Host "    ✓ Found $($pbixFiles.Count) dashboard file(s)" -ForegroundColor Green
} else {
    Write-Host "    ⚠ Skipping dashboard deployment" -ForegroundColor Yellow
}

Write-Host ""

# Confirm execution
Write-Host "Ready to Deploy" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  This script will execute the following steps:`n" -ForegroundColor Gray

$stepNumber = 1
foreach ($script in $scripts) {
    if (-not $script.Skip) {
        Write-Host "    $stepNumber. $($script.Name)" -ForegroundColor White
        $stepNumber++
    } else {
        Write-Host "    ⊗  $($script.Name) (Skipped)" -ForegroundColor DarkGray
    }
}

Write-Host "`n  Do you want to continue? (Y/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host "`n  ❌ Deployment cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""

# Execute deployment scripts
$startTime = Get-Date
$successfulSteps = 0
$totalSteps = ($scripts | Where-Object { -not $_.Skip }).Count

foreach ($script in $scripts) {
    if ($script.Skip) {
        continue
    }

    $stepStartTime = Get-Date

    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Step $($successfulSteps + 1) of $totalSteps: $($script.Name)" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

    try {
        $scriptFile = Join-Path $scriptPath $script.Script
        & $scriptFile

        $stepDuration = (Get-Date) - $stepStartTime
        Write-Host "`n  ✓ Completed in $([math]::Round($stepDuration.TotalSeconds, 1)) seconds" -ForegroundColor Green
        $successfulSteps++

    } catch {
        Write-Host "`n  ❌ Step failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n  Deployment stopped at step: $($script.Name)" -ForegroundColor Yellow
        exit 1
    }

    Write-Host ""
}

# Final summary
$totalDuration = (Get-Date) - $startTime

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Completed steps: $successfulSteps of $totalSteps" -ForegroundColor Gray
Write-Host "  Total time: $([math]::Round($totalDuration.TotalMinutes, 1)) minutes" -ForegroundColor Gray
Write-Host ""

# Load deployment info and display links
$deploymentInfoPath = Join-Path $scriptPath "..\config\deployment-info.json"
if (Test-Path $deploymentInfoPath) {
    $deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
    $workspaceId = $deploymentInfo.workspaceId

    Write-Host "Access Your Dashboards:" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

    foreach ($report in $deploymentInfo.deployedReports) {
        $reportUrl = "https://app.powerbi.com/groups/$workspaceId/reports/$($report.id)"
        Write-Host "`n  $($report.name):" -ForegroundColor White
        Write-Host "    $reportUrl" -ForegroundColor Cyan
    }

    Write-Host "`n  Workspace:" -ForegroundColor White
    Write-Host "    https://app.powerbi.com/groups/$workspaceId" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  1. Configure data source credentials in Power BI Service" -ForegroundColor White
Write-Host "     (Settings > Datasets > Data source credentials)" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Verify the first data refresh completes successfully" -ForegroundColor White
Write-Host ""
Write-Host "  3. Share the dashboard links with your stakeholders" -ForegroundColor White
Write-Host "     (Links saved in: config\access-links.txt)" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Monitor refresh status in Power BI Service" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  See powerbi\README.md for detailed information" -ForegroundColor Gray
Write-Host ""
