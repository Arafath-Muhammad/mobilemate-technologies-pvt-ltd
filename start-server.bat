@echo off
title MobileMate POS Server
echo ====================================================
echo Starting MobileMate POS Server on http://localhost:3000
echo ====================================================

where node >nul 2>nul
if %errorlevel% equ 0 (
    node server.js
    goto end
)

if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    call "%APPDATA%\Antigravity\bin\agy-node.cmd" server.js
    goto end
)

if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" (
    set ELECTRON_RUN_AS_NODE=1
    "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" server.js
    goto end
)

echo Warning: Node.js was not found in PATH or standard directories.
echo Attempting to start with npx serve...
npx serve . -l 3000

:end
pause
