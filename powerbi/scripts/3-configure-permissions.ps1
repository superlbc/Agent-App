# ==============================================================================
# 3-configure-permissions.ps1
# Configures workspace permissions and shares dashboards with stakeholders
# ==============================================================================

param(
    [string]$StakeholderFile = "..\config\stakeholder-list.json"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Power BI Permission Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Import module
Import-Module MicrosoftPowerBIMgmt

# Load configuration
Write-Host "[1/5] Loading configuration..." -ForegroundColor Yellow
$workspaceInfoPath = "..\config\workspace-info.json"

if (-not (Test-Path $workspaceInfoPath)) {
    Write-Host "  ❌ Workspace info not found. Please run 1-create-workspace.ps1 first" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $StakeholderFile)) {
    Write-Host "  ❌ Stakeholder list not found: $StakeholderFile" -ForegroundColor Red
    exit 1
}

$workspaceInfo = Get-Content $workspaceInfoPath | ConvertFrom-Json
$stakeholders = Get-Content $StakeholderFile | ConvertFrom-Json
$workspaceId = $workspaceInfo.workspaceId

Write-Host "  ✓ Configuration loaded" -ForegroundColor Green
Write-Host "    Workspace: $($workspaceInfo.workspaceName)" -ForegroundColor Gray

# Login to Power BI Service
Write-Host "`n[2/5] Connecting to Power BI Service..." -ForegroundColor Yellow
try {
    Connect-PowerBIServiceAccount | Out-Null
    Write-Host "  ✓ Successfully authenticated" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add Admins
Write-Host "`n[3/5] Adding workspace admins..." -ForegroundColor Yellow
$adminCount = 0
foreach ($admin in $stakeholders.admins) {
    Write-Host "  Adding admin: $admin" -ForegroundColor White
    try {
        Add-PowerBIWorkspaceUser -WorkspaceId $workspaceId -UserPrincipalName $admin -AccessRight Admin
        Write-Host "    ✓ Successfully added as Admin" -ForegroundColor Green
        $adminCount++
    } catch {
        if ($_.Exception.Message -like "*already has access*") {
            Write-Host "    ⚠ User already has access" -ForegroundColor Yellow
        } else {
            Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host "`n  ✓ Added $adminCount admin(s)" -ForegroundColor Green

# Add Members (Contributors)
Write-Host "`n[4/5] Adding workspace members..." -ForegroundColor Yellow
$memberCount = 0
foreach ($member in $stakeholders.members) {
    Write-Host "  Adding member: $member" -ForegroundColor White
    try {
        Add-PowerBIWorkspaceUser -WorkspaceId $workspaceId -UserPrincipalName $member -AccessRight Member
        Write-Host "    ✓ Successfully added as Member" -ForegroundColor Green
        $memberCount++
    } catch {
        if ($_.Exception.Message -like "*already has access*") {
            Write-Host "    ⚠ User already has access" -ForegroundColor Yellow
        } else {
            Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host "`n  ✓ Added $memberCount member(s)" -ForegroundColor Green

# Add Viewers
Write-Host "`n[5/5] Adding dashboard viewers..." -ForegroundColor Yellow
$viewerCount = 0
foreach ($viewer in $stakeholders.viewers) {
    Write-Host "  Adding viewer: $viewer" -ForegroundColor White
    try {
        Add-PowerBIWorkspaceUser -WorkspaceId $workspaceId -UserPrincipalName $viewer -AccessRight Viewer
        Write-Host "    ✓ Successfully added as Viewer" -ForegroundColor Green
        $viewerCount++
    } catch {
        if ($_.Exception.Message -like "*already has access*") {
            Write-Host "    ⚠ User already has access" -ForegroundColor Yellow
        } else {
            Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host "`n  ✓ Added $viewerCount viewer(s)" -ForegroundColor Green

# Generate sharing links
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Generating Access Links" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$deploymentInfoPath = "..\config\deployment-info.json"
if (Test-Path $deploymentInfoPath) {
    $deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
    $workspace = Get-PowerBIWorkspace -Id $workspaceId

    Write-Host "Share these links with your stakeholders:`n" -ForegroundColor White

    foreach ($report in $deploymentInfo.deployedReports) {
        $reportUrl = "https://app.powerbi.com/groups/$workspaceId/reports/$($report.id)"
        Write-Host "$($report.name):" -ForegroundColor Yellow
        Write-Host "  $reportUrl`n" -ForegroundColor Gray
    }

    # Save access links
    $accessLinksPath = "..\config\access-links.txt"
    $linksContent = "Momo Analytics Platform - Dashboard Access Links`n"
    $linksContent += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    $linksContent += "=" * 60 + "`n`n"

    foreach ($report in $deploymentInfo.deployedReports) {
        $reportUrl = "https://app.powerbi.com/groups/$workspaceId/reports/$($report.id)"
        $linksContent += "$($report.name):`n$reportUrl`n`n"
    }

    $linksContent += "`nWorkspace:`nhttps://app.powerbi.com/groups/$workspaceId`n"

    $linksContent | Out-File $accessLinksPath -Encoding UTF8
    Write-Host "✓ Access links saved to: $accessLinksPath" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✓ Permission Configuration Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAccess Summary:" -ForegroundColor White
Write-Host "  Admins: $adminCount" -ForegroundColor Gray
Write-Host "  Members: $memberCount" -ForegroundColor Gray
Write-Host "  Viewers: $viewerCount" -ForegroundColor Gray
Write-Host "`nNext Step:" -ForegroundColor White
Write-Host "  Run: .\4-configure-refresh.ps1" -ForegroundColor Yellow
Write-Host ""
