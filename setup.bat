@echo off
title Bolsa de Trabajo - Instalacion Automatica
echo ======================================================
echo  Ejecutando script de instalacion automatica...
echo ======================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
pause
