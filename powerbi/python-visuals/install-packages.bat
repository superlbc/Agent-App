@echo off
REM ==============================================================================
REM Install Python Packages for Power BI Visuals
REM Run this as Administrator
REM ==============================================================================

echo.
echo ========================================
echo  Python Package Installation
echo  for Power BI Visuals
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Upgrade pip first
echo [1/4] Upgrading pip...
python -m pip install --upgrade pip
echo.

REM Install matplotlib
echo [2/4] Installing matplotlib...
pip install matplotlib
if errorlevel 1 (
    echo ERROR: Failed to install matplotlib
    pause
    exit /b 1
)
echo.

REM Install pandas
echo [3/4] Installing pandas...
pip install pandas
if errorlevel 1 (
    echo ERROR: Failed to install pandas
    pause
    exit /b 1
)
echo.

REM Install numpy
echo [4/4] Installing numpy...
pip install numpy
if errorlevel 1 (
    echo ERROR: Failed to install numpy
    pause
    exit /b 1
)
echo.

echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Installed packages:
pip show matplotlib | findstr "Name Version"
pip show pandas | findstr "Name Version"
pip show numpy | findstr "Name Version"
echo.
echo Next steps:
echo 1. Close this window
echo 2. Restart Power BI Desktop completely
echo 3. Try the Python visual again
echo.
pause
