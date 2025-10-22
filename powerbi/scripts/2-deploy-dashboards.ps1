# ==============================================================================
# 2-deploy-dashboards.ps1
# Deploys .pbix files to Power BI Service workspace
# ==============================================================================

param(
    [string]$ConfigFile = "..\config\deployment-config.json",
    [string]$PbixFolder = "..\dashboards"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Power BI Dashboard Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Import module
Import-Module MicrosoftPowerBIMgmt

# Load configuration
Write-Host "[1/6] Loading configuration..." -ForegroundColor Yellow
$config = Get-Content $ConfigFile | ConvertFrom-Json
$workspaceInfoPath = "..\config\workspace-info.json"

if (-not (Test-Path $workspaceInfoPath)) {
    Write-Host "  ❌ Workspace info not found. Please run 1-create-workspace.ps1 first" -ForegroundColor Red
    exit 1
}

$workspaceInfo = Get-Content $workspaceInfoPath | ConvertFrom-Json
$workspaceId = $workspaceInfo.workspaceId
Write-Host "  ✓ Configuration loaded" -ForegroundColor Green
Write-Host "    Workspace: $($workspaceInfo.workspaceName)" -ForegroundColor Gray
Write-Host "    Workspace ID: $workspaceId" -ForegroundColor Gray

# Login to Power BI Service
Write-Host "`n[2/6] Connecting to Power BI Service..." -ForegroundColor Yellow
try {
    Connect-PowerBIServiceAccount | Out-Null
    Write-Host "  ✓ Successfully authenticated" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check for .pbix files
Write-Host "`n[3/6] Looking for dashboard files..." -ForegroundColor Yellow
if (-not (Test-Path $PbixFolder)) {
    Write-Host "  ⚠ Dashboard folder not found: $PbixFolder" -ForegroundColor Yellow
    Write-Host "    Creating folder..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $PbixFolder | Out-Null
}

$pbixFiles = Get-ChildItem -Path $PbixFolder -Filter "*.pbix"

if ($pbixFiles.Count -eq 0) {
    Write-Host "  ❌ No .pbix files found in $PbixFolder" -ForegroundColor Red
    Write-Host "`n  Expected files:" -ForegroundColor Yellow
    Write-Host "    - MeetingNotesGenerator.pbix" -ForegroundColor Gray
    Write-Host "    - EstimateCrafter.pbix" -ForegroundColor Gray
    Write-Host "    - UnifiedAnalytics.pbix" -ForegroundColor Gray
    Write-Host "`n  Please build the dashboards first using the guide:" -ForegroundColor Yellow
    Write-Host "    powerbi\BUILD-DASHBOARDS.md" -ForegroundColor Gray
    exit 1
}

Write-Host "  ✓ Found $($pbixFiles.Count) dashboard file(s)" -ForegroundColor Green
foreach ($file in $pbixFiles) {
    Write-Host "    - $($file.Name)" -ForegroundColor Gray
}

# Deploy each dashboard
Write-Host "`n[4/6] Deploying dashboards..." -ForegroundColor Yellow
$deployedReports = @()

foreach ($pbixFile in $pbixFiles) {
    $reportName = [System.IO.Path]::GetFileNameWithoutExtension($pbixFile.Name)
    Write-Host "`n  Deploying: $reportName" -ForegroundColor White

    try {
        # Upload .pbix file to workspace
        $report = New-PowerBIReport -Path $pbixFile.FullName -WorkspaceId $workspaceId -ConflictAction CreateOrOverwrite

        Write-Host "    ✓ Successfully deployed" -ForegroundColor Green
        Write-Host "      Report ID: $($report.Id)" -ForegroundColor Gray

        $deployedReports += @{
            name = $reportName
            id = $report.Id
            fileName = $pbixFile.Name
            deployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    } catch {
        Write-Host "    ❌ Failed to deploy: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Update dataset connections
Write-Host "`n[5/6] Configuring dataset connections..." -ForegroundColor Yellow
$sqlServer = $config.sqlServer
$sqlDatabase = $config.sqlDatabase

foreach ($report in $deployedReports) {
    Write-Host "  Updating connection for: $($report.name)" -ForegroundColor White

    try {
        # Get dataset for this report
        $datasets = Get-PowerBIDataset -WorkspaceId $workspaceId | Where-Object { $_.Name -eq $report.name }

        if ($datasets) {
            $datasetId = $datasets[0].Id

            # Note: Credential updates require Power BI REST API
            # This is documented in the deployment guide
            Write-Host "    ✓ Dataset found: $datasetId" -ForegroundColor Green
            Write-Host "    ⚠ Manual step required: Update credentials in Power BI Service" -ForegroundColor Yellow
            Write-Host "      See: powerbi\README.md - Data Source Credentials" -ForegroundColor Gray
        }
    } catch {
        Write-Host "    ⚠ Could not update connection: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Save deployment information
Write-Host "`n[6/6] Saving deployment information..." -ForegroundColor Yellow
$deploymentInfoPath = "..\config\deployment-info.json"
$deploymentInfo = @{
    workspaceId = $workspaceId
    workspaceName = $workspaceInfo.workspaceName
    deployedReports = $deployedReports
    deployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    sqlServer = $sqlServer
    sqlDatabase = $sqlDatabase
}
$deploymentInfo | ConvertTo-Json -Depth 5 | Out-File $deploymentInfoPath -Encoding UTF8
Write-Host "  ✓ Deployment info saved to: $deploymentInfoPath" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✓ Deployment Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nDeployed Reports:" -ForegroundColor White
foreach ($report in $deployedReports) {
    Write-Host "  ✓ $($report.name)" -ForegroundColor Green
}

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "  1. Update data source credentials in Power BI Service" -ForegroundColor Yellow
Write-Host "     (Settings > Data source credentials)" -ForegroundColor Gray
Write-Host "  2. Run: .\3-configure-permissions.ps1" -ForegroundColor Yellow
Write-Host "  3. Run: .\4-configure-refresh.ps1" -ForegroundColor Yellow
Write-Host ""
