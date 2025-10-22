# =============================================================================
# SQL Connection Validator
# =============================================================================
# Purpose: Test SQL Server connection before building Power BI dashboards
# Usage: .\validate-connection.ps1
# =============================================================================

param(
    [string]$ConfigFile = "..\config\sql-connection.json"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SQL Connection Validator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create config/sql-connection.json with your connection details." -ForegroundColor Yellow
    exit 1
}

try {
    $config = Get-Content $ConfigFile | ConvertFrom-Json
} catch {
    Write-Host "❌ Failed to parse configuration file" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Build connection string
$server = $config.server
$database = $config.database
$auth = $config.authentication

Write-Host "Testing connection to:" -ForegroundColor White
Write-Host "  Server: $server" -ForegroundColor Gray
Write-Host "  Database: $database" -ForegroundColor Gray
Write-Host "  Authentication: $auth" -ForegroundColor Gray
Write-Host ""

# Build connection string based on auth type
switch ($auth) {
    "SQL" {
        $username = $config.username
        $password = $config.password
        $connectionString = "Server=$server;Database=$database;User Id=$username;Password=$password;Encrypt=True;TrustServerCertificate=False;"
    }
    "Windows" {
        $connectionString = "Server=$server;Database=$database;Integrated Security=True;"
    }
    "AzureAD" {
        $connectionString = "Server=$server;Database=$database;Authentication=Active Directory Integrated;Encrypt=True;"
    }
    default {
        Write-Host "❌ Unknown authentication type: $auth" -ForegroundColor Red
        exit 1
    }
}

# Test connection
try {
    Write-Host "Connecting to SQL Server..." -ForegroundColor Yellow

    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()

    Write-Host "✓ Connected successfully" -ForegroundColor Green
    Write-Host ""

    # Test each view
    $views = @(
        "vw_MeetingNotesGenerator",
        "vw_EstimateCrafter",
        "vw_UnifiedAnalytics"
    )

    $allViewsExist = $true

    foreach ($view in $views) {
        $query = "SELECT COUNT(*) as RowCount FROM $view"
        $command = $connection.CreateCommand()
        $command.CommandText = $query

        try {
            $reader = $command.ExecuteReader()
            if ($reader.Read()) {
                $rowCount = $reader["RowCount"]
                Write-Host "✓ View exists: $view ($rowCount rows)" -ForegroundColor Green
            }
            $reader.Close()
        } catch {
            Write-Host "❌ View not found or inaccessible: $view" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
            $allViewsExist = $false
        }
    }

    $connection.Close()

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan

    if ($allViewsExist) {
        Write-Host "Connection Status: READY ✓" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now build Power BI dashboards!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Connection Status: INCOMPLETE" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Some views are missing. Please run:" -ForegroundColor Yellow
        Write-Host "  cd ..\database" -ForegroundColor White
        Write-Host "  .\deploy-views.ps1" -ForegroundColor White
        exit 1
    }

} catch {
    Write-Host ""
    Write-Host "❌ Connection failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Check server name and database name" -ForegroundColor White
    Write-Host "  2. Verify firewall allows your IP address" -ForegroundColor White
    Write-Host "  3. Check username/password (if using SQL auth)" -ForegroundColor White
    Write-Host "  4. Ensure you have read permissions on the database" -ForegroundColor White
    exit 1
}
