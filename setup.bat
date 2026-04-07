@echo off
REM ============================================================================
REM ANALISI TRACKER - SETUP SCRIPT
REM ============================================================================
REM One-time setup for Windows systems
REM ============================================================================

setlocal enabledelayedexpansion

echo ==========================================================================
echo   Analisi Tracker - Setup
echo ==========================================================================
echo.

REM 1. Check Node.js installation
echo [1/8] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check if version is 18 or higher
for /f "tokens=1 delims=v." %%a in ("%NODE_VERSION%") do set NODE_MAJOR=%%a
if %NODE_MAJOR% lss 18 (
    echo [WARN] Node.js 18+ recommended (you have %NODE_VERSION%)
    echo The app may still work, but consider upgrading for best compatibility.
)

echo.

REM 2. Check npm installation
echo [2/8] Checking npm installation...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo npm should be installed with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM 3. Create .env file if it doesn't exist
echo [3/8] Setting up environment configuration...
if not exist .env (
    if exist .env.local (
        echo Creating .env from .env.local...
        copy .env.local .env >nul
        echo [OK] Created .env file
    ) else if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env >nul
        echo [OK] Created .env file
    ) else (
        echo Creating minimal .env file...
        echo PORT=3000 > .env
        echo NODE_ENV=development >> .env
        echo [OK] Created .env file
    )
) else (
    echo [INFO] .env file already exists (skipping)
)
echo.

REM 4. Create necessary directories
echo [4/8] Creating necessary directories...
if not exist "data\processed" mkdir "data\processed"
if not exist "logs" mkdir "logs"
if not exist "exports" mkdir "exports"
echo [OK] Created directories
echo.

REM 5. Install root dependencies
echo [5/8] Installing root dependencies...
if not exist "node_modules" (
    call npm install
    echo [OK] Root dependencies installed
) else (
    echo [INFO] Root node_modules exists (skipping npm install)
)
echo.

REM 6. Install client dependencies
echo [6/8] Installing client dependencies...
if not exist "client\node_modules" (
    cd client
    call npm install
    cd ..
    echo [OK] Client dependencies installed
) else (
    echo [INFO] Client node_modules exists (skipping npm install)
)
echo.

REM 7. Initialize lab data
echo [7/8] Initializing lab data...
if not exist "data\lab-data.json" (
    if exist "data\lab-data-initial.json" (
        echo Creating lab-data.json with Chiara and Causio sample data...
        copy data\lab-data-initial.json data\lab-data.json >nul
        echo [OK] Created lab-data.json with sample patients
    ) else if exist "data\sample-data.json" (
        echo Creating lab-data.json from sample data...
        copy data\sample-data.json data\lab-data.json >nul
        echo [OK] Created lab-data.json
    ) else (
        echo Creating minimal lab-data.json...
        echo { > data\lab-data.json
        echo   "labTests": {}, >> data\lab-data.json
        echo   "context": { >> data\lab-data.json
        echo     "medications": [], >> data\lab-data.json
        echo     "events": [] >> data\lab-data.json
        echo   } >> data\lab-data.json
        echo } >> data\lab-data.json
        echo [OK] Created minimal lab-data.json
    )
) else (
    echo [INFO] lab-data.json already exists (skipping)
)
echo.

REM 8. Setup complete
echo ==========================================================================
echo [SUCCESS] Setup Complete!
echo ==========================================================================
echo.
echo Next steps:
echo   1. Review .env file (optional - all features work with defaults)
echo   2. Add API keys to .env if you want AI features (optional)
echo   3. Run: start.bat
echo.
echo Your app will be available at: http://localhost:3000
echo.
echo For more information, see QUICKSTART.md
echo ==========================================================================
echo.
pause
