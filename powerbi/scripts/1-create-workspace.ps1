# ==============================================================================
# 1-create-workspace.ps1
# Creates Power BI workspace for Momo Analytics dashboards
# ==============================================================================

param(
    [string]$ConfigFile = "..\config\deployment-config.json"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Power BI Workspace Creation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Power BI module is installed
Write-Host "[1/5] Checking Power BI PowerShell module..." -ForegroundColor Yellow
if (-not (Get-Module -ListAvailable -Name MicrosoftPowerBIMgmt)) {
    Write-Host "  ❌ MicrosoftPowerBIMgmt module not found" -ForegroundColor Red
    Write-Host "`n  Installing module (this may take a minute)..." -ForegroundColor Yellow
    Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser -Force -AllowClobber
    Write-Host "  ✓ Module installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✓ Module already installed" -ForegroundColor Green
}

# Import module
Import-Module MicrosoftPowerBIMgmt

# Load configuration
Write-Host "`n[2/5] Loading configuration..." -ForegroundColor Yellow
if (-not (Test-Path $ConfigFile)) {
    Write-Host "  ❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "  Please create the file from deployment-config.json template" -ForegroundColor Red
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
$workspaceName = $config.workspaceName
Write-Host "  ✓ Configuration loaded" -ForegroundColor Green
Write-Host "    Workspace name: $workspaceName" -ForegroundColor Gray

# Login to Power BI Service
Write-Host "`n[3/5] Connecting to Power BI Service..." -ForegroundColor Yellow
Write-Host "  A browser window will open for authentication..." -ForegroundColor Gray

try {
    Connect-PowerBIServiceAccount | Out-Null
    Write-Host "  ✓ Successfully authenticated" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if workspace already exists
Write-Host "`n[4/5] Checking for existing workspace..." -ForegroundColor Yellow
$existingWorkspace = Get-PowerBIWorkspace -Name $workspaceName

if ($existingWorkspace) {
    Write-Host "  ⚠ Workspace already exists: $workspaceName" -ForegroundColor Yellow
    Write-Host "    Workspace ID: $($existingWorkspace.Id)" -ForegroundColor Gray
    Write-Host "`n  Do you want to use the existing workspace? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "  ✓ Using existing workspace" -ForegroundColor Green
        $workspace = $existingWorkspace
    } else {
        Write-Host "  ❌ Operation cancelled by user" -ForegroundColor Red
        exit 0
    }
} else {
    # Create new workspace
    Write-Host "  Creating new workspace..." -ForegroundColor Gray

    try {
        $workspace = New-PowerBIWorkspace -Name $workspaceName
        Write-Host "  ✓ Workspace created successfully" -ForegroundColor Green
        Write-Host "    Workspace ID: $($workspace.Id)" -ForegroundColor Gray
    } catch {
        Write-Host "  ❌ Failed to create workspace: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Save workspace ID to config for next scripts
Write-Host "`n[5/5] Saving workspace information..." -ForegroundColor Yellow
$workspaceInfoPath = "..\config\workspace-info.json"
$workspaceInfo = @{
    workspaceId = $workspace.Id
    workspaceName = $workspace.Name
    createdDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    status = "ready"
}
$workspaceInfo | ConvertTo-Json | Out-File $workspaceInfoPath -Encoding UTF8
Write-Host "  ✓ Workspace info saved to: $workspaceInfoPath" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✓ Workspace Setup Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nWorkspace Details:" -ForegroundColor White
Write-Host "  Name: $($workspace.Name)" -ForegroundColor Gray
Write-Host "  ID: $($workspace.Id)" -ForegroundColor Gray
Write-Host "  Type: $($workspace.Type)" -ForegroundColor Gray
Write-Host "`nNext Step:" -ForegroundColor White
Write-Host "  Run: .\2-deploy-dashboards.ps1" -ForegroundColor Yellow
Write-Host ""
