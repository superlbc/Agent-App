# ==============================================================================
# 4-configure-refresh.ps1
# Configures automatic data refresh schedules for Power BI datasets
# ==============================================================================

param(
    [string]$ConfigFile = "..\config\deployment-config.json"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Power BI Refresh Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Import module
Import-Module MicrosoftPowerBIMgmt

# Load configuration
Write-Host "[1/4] Loading configuration..." -ForegroundColor Yellow
$config = Get-Content $ConfigFile | ConvertFrom-Json
$workspaceInfoPath = "..\config\workspace-info.json"
$deploymentInfoPath = "..\config\deployment-info.json"

if (-not (Test-Path $workspaceInfoPath)) {
    Write-Host "  ❌ Workspace info not found. Please run 1-create-workspace.ps1 first" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $deploymentInfoPath)) {
    Write-Host "  ❌ Deployment info not found. Please run 2-deploy-dashboards.ps1 first" -ForegroundColor Red
    exit 1
}

$workspaceInfo = Get-Content $workspaceInfoPath | ConvertFrom-Json
$deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
$workspaceId = $workspaceInfo.workspaceId

Write-Host "  ✓ Configuration loaded" -ForegroundColor Green
Write-Host "    Workspace: $($workspaceInfo.workspaceName)" -ForegroundColor Gray
Write-Host "    Refresh schedule: $($config.refreshSchedule.frequency) at $($config.refreshSchedule.time)" -ForegroundColor Gray

# Login to Power BI Service
Write-Host "`n[2/4] Connecting to Power BI Service..." -ForegroundColor Yellow
try {
    Connect-PowerBIServiceAccount | Out-Null
    Write-Host "  ✓ Successfully authenticated" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get datasets
Write-Host "`n[3/4] Finding datasets..." -ForegroundColor Yellow
$datasets = Get-PowerBIDataset -WorkspaceId $workspaceId

if ($datasets.Count -eq 0) {
    Write-Host "  ❌ No datasets found in workspace" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Found $($datasets.Count) dataset(s)" -ForegroundColor Green
foreach ($dataset in $datasets) {
    Write-Host "    - $($dataset.Name)" -ForegroundColor Gray
}

# Configure refresh schedule using REST API
Write-Host "`n[4/4] Configuring refresh schedules..." -ForegroundColor Yellow

# Get access token
$token = (Get-PowerBIAccessToken).Authorization.Replace("Bearer ", "")
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Parse refresh time (e.g., "06:00" -> "06" and "00")
$refreshTime = $config.refreshSchedule.time
$timeParts = $refreshTime.Split(":")
$hour = $timeParts[0]
$minute = $timeParts[1]

# Build refresh schedule body
$refreshScheduleBody = @{
    value = @{
        days = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
        times = @("$($hour):$($minute)")
        enabled = $true
        localTimeZoneId = $config.refreshSchedule.timezone
        notifyOption = "MailOnFailure"
    }
} | ConvertTo-Json -Depth 5

foreach ($dataset in $datasets) {
    Write-Host "`n  Configuring: $($dataset.Name)" -ForegroundColor White

    try {
        # Update refresh schedule
        $apiUrl = "https://api.powerbi.com/v1.0/myorg/groups/$workspaceId/datasets/$($dataset.Id)/refreshSchedule"

        $response = Invoke-RestMethod -Uri $apiUrl -Method Patch -Headers $headers -Body $refreshScheduleBody

        Write-Host "    ✓ Refresh schedule configured" -ForegroundColor Green
        Write-Host "      Frequency: $($config.refreshSchedule.frequency)" -ForegroundColor Gray
        Write-Host "      Time: $($config.refreshSchedule.time) $($config.refreshSchedule.timezone)" -ForegroundColor Gray

        # Trigger initial refresh
        Write-Host "    Triggering initial refresh..." -ForegroundColor Gray
        $refreshUrl = "https://api.powerbi.com/v1.0/myorg/groups/$workspaceId/datasets/$($dataset.Id)/refreshes"

        try {
            Invoke-RestMethod -Uri $refreshUrl -Method Post -Headers $headers
            Write-Host "    ✓ Initial refresh started" -ForegroundColor Green
        } catch {
            Write-Host "    ⚠ Could not trigger refresh: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "      This is normal if data source credentials are not configured yet" -ForegroundColor Gray
        }

    } catch {
        Write-Host "    ❌ Failed to configure refresh: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Save refresh configuration
$refreshConfigPath = "..\config\refresh-config.json"
$refreshConfig = @{
    workspaceId = $workspaceId
    refreshSchedule = $config.refreshSchedule
    datasets = @()
    configuredAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

foreach ($dataset in $datasets) {
    $refreshConfig.datasets += @{
        id = $dataset.Id
        name = $dataset.Name
        status = "configured"
    }
}

$refreshConfig | ConvertTo-Json -Depth 5 | Out-File $refreshConfigPath -Encoding UTF8
Write-Host "`n  ✓ Refresh configuration saved to: $refreshConfigPath" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✓ Refresh Configuration Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nRefresh Schedule:" -ForegroundColor White
Write-Host "  Frequency: $($config.refreshSchedule.frequency)" -ForegroundColor Gray
Write-Host "  Time: $($config.refreshSchedule.time)" -ForegroundColor Gray
Write-Host "  Timezone: $($config.refreshSchedule.timezone)" -ForegroundColor Gray
Write-Host "  Configured datasets: $($datasets.Count)" -ForegroundColor Gray
Write-Host "`nImportant:" -ForegroundColor Yellow
Write-Host "  - Data source credentials must be configured in Power BI Service" -ForegroundColor Gray
Write-Host "  - Go to Settings > Datasets > Data source credentials" -ForegroundColor Gray
Write-Host "  - Enter SQL Server username and password" -ForegroundColor Gray
Write-Host "`nMonitor Refresh Status:" -ForegroundColor White
Write-Host "  https://app.powerbi.com/groups/$workspaceId" -ForegroundColor Gray
Write-Host ""
