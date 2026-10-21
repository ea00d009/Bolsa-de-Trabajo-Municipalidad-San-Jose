@echo off
title Bolsa de Trabajo - Launcher
echo ======================================================
echo  Iniciando Bolsa de Trabajo - San Jose
echo ======================================================

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\mariadb\bin;%PATH%"

:: Iniciar MariaDB local si no esta corriendo en puerto 3306
netstat -ano | findstr ":3306 " | findstr "LISTENING" > nul
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Programs\mariadb\bin\mysqld.exe" (
        echo [0/2] Iniciando servidor MariaDB local (puerto 3306)...
        start "MariaDB - BolsaTrabajo" /min "%LOCALAPPDATA%\Programs\mariadb\bin\mysqld.exe" --datadir="%LOCALAPPDATA%\Programs\mariadb\data" --port=3306 --console
        timeout /t 3 /nobreak > nul
    )
)

:: Verificar backend/.env
if not exist "backend\.env" (
    echo Creando backend\.env con configuracion local...
    powershell -NoProfile -Command "$jwt = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'); Set-Content -Path 'backend\.env' -Value \"DB_NAME=oficina_empleo_sanjose`r`nDB_USERNAME=root`r`nDB_PASSWORD=`r`nJWT_SECRET=$jwt`r`nALLOWED_ORIGINS=http://localhost:5173`r`nSWAGGER_ENABLED=false\" -Encoding UTF8"
)

:: Asegurar certificado SSL/HTTPS local
if exist "scripts\ensure-https-cert.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ensure-https-cert.ps1" -InstallRootCA
)

echo.
echo [1/2] Iniciando Backend Spring Boot (puerto 8080)...
start "Backend - BolsaTrabajo" cmd /k "cd /d "%~dp0backend" && mvnw.cmd spring-boot:run"

echo.
echo [2/2] Iniciando Frontend React + Vite HTTPS (puerto 5173)...
start "Frontend - BolsaTrabajo" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Esperando a que el servidor inicialice...
timeout /t 5 /nobreak > nul

echo Abriendo navegador en https://localhost:5173...
start https://localhost:5173

echo.
echo ======================================================
echo  Aplicacion iniciada correctamente.
echo  Podes cerrar esta ventana, el backend y el frontend
echo  seguiran ejecutandose en sus respectivas ventanas.
echo ======================================================
pause
