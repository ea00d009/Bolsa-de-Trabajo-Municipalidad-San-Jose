@echo off
chcp 65001 >nul
echo ============================================================================
echo   ACTUALIZACIÓN AUTOMÁTICA DE PRODUCCIÓN (CD) - OFICINA DE EMPLEO SAN JOSÉ
echo ============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-production.ps1"
echo.
pause
