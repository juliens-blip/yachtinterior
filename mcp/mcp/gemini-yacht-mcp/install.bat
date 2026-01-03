@echo off
REM ============================================================================
REM Gemini Yacht MCP Server - Automated Installation Script (Windows)
REM ============================================================================
REM
REM This script automates the installation process:
REM 1. Checks Python version
REM 2. Creates virtual environment
REM 3. Installs dependencies
REM 4. Creates .env file
REM 5. Tests installation
REM
REM Usage: Double-click this file or run: install.bat
REM
REM ============================================================================

echo.
echo ============================================================================
echo   GEMINI YACHT MCP SERVER - AUTOMATED INSTALLATION
echo ============================================================================
echo.

REM Check if Python is installed
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Get Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo       Found Python %PYTHON_VERSION%

REM Check Python version (rough check for 3.9+)
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
)

if %MAJOR% LSS 3 (
    echo ERROR: Python 3.9+ required, found Python %PYTHON_VERSION%
    pause
    exit /b 1
)

if %MAJOR% EQU 3 if %MINOR% LSS 9 (
    echo ERROR: Python 3.9+ required, found Python %PYTHON_VERSION%
    pause
    exit /b 1
)

echo       Python version OK
echo.

REM Create virtual environment
echo [2/6] Creating virtual environment...
if exist venv (
    echo       Virtual environment already exists, skipping
) else (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo       Virtual environment created
)
echo.

REM Activate virtual environment
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo       Virtual environment activated
echo.

REM Upgrade pip
echo [4/6] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo       pip upgraded
echo.

REM Install dependencies
echo [5/6] Installing dependencies...
echo       This may take 1-2 minutes...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo       Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
echo [6/6] Configuring environment...
if exist .env (
    echo       .env file already exists, skipping
) else (
    copy .env.example .env >nul
    echo       .env file created from template
    echo.
    echo ============================================================================
    echo   IMPORTANT: Configure your Gemini API key
    echo ============================================================================
    echo.
    echo   1. Open .env file in a text editor
    echo   2. Replace 'your_gemini_api_key_here' with your actual API key
    echo   3. Get API key from: https://aistudio.google.com/app/apikey
    echo.
    echo   Press any key to open .env file now...
    pause >nul
    notepad .env
)
echo.

REM Run tests
echo.
echo ============================================================================
echo   Installation Complete! Running tests...
echo ============================================================================
echo.
echo NOTE: Tests will call Gemini API - ensure .env has valid API key
echo.
echo Press any key to run tests, or Ctrl+C to skip...
pause >nul

python test_server.py
if errorlevel 1 (
    echo.
    echo ============================================================================
    echo   TESTS FAILED
    echo ============================================================================
    echo.
    echo   Please check:
    echo   1. GEMINI_API_KEY is set correctly in .env
    echo   2. API key is valid and active
    echo   3. Internet connection is working
    echo.
    echo   Run tests manually: python test_server.py
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   SUCCESS! Installation and tests completed
echo ============================================================================
echo.
echo   Next steps:
echo.
echo   1. Add to Claude Code:
echo      claude mcp add --transport stdio gemini-yacht -- python "%CD%\main.py"
echo.
echo   2. Or manually configure .mcp.json:
echo      {
echo        "mcpServers": {
echo          "gemini-yacht": {
echo            "command": "python",
echo            "args": ["%CD%\main.py"],
echo            "env": {
echo              "GEMINI_API_KEY": "your_api_key_here"
echo            }
echo          }
echo        }
echo      }
echo.
echo   3. Restart Claude Code
echo.
echo   4. Verify: /mcp list
echo.
echo   Documentation:
echo   - Quick Start: QUICKSTART.md
echo   - Full Guide: README.md
echo   - Examples: EXAMPLES.md
echo.
echo ============================================================================
echo.
pause
