@echo off
echo Building PDF Editor for Windows...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Build for Windows
echo Building NSIS installer and portable executable...
npm run build:windows

echo Windows build completed! Check the dist/ directory for output files.
pause