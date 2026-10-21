@echo off
title Bolsa de Trabajo - Detener Servicios
echo ======================================================
echo  Deteniendo servicios de Bolsa de Trabajo...
echo ======================================================

schtasks /Change /TN "BolsaTrabajoWatchdog" /DISABLE >nul 2>&1

for %%P in (5173 8080 3306) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo Deteniendo proceso en puerto %%P (PID %%a)...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo Todos los servicios (Frontend, Backend y MariaDB) fueron detenidos.
pause
