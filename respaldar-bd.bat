@echo off
chcp 65001 >nul
echo ============================================================================
echo   GENERANDO RESPALDO MANUAL DE LA BASE DE DATOS - OFICINA DE EMPLEO
echo ============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup-db.ps1" -Force
echo.
echo Los respaldos se guardan en: %~dp0database\backups_locales
pause
