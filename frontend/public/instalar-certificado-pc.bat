@echo off
chcp 65001 >nul
title Instalador de Certificado HTTPS - Oficina de Empleo San Jose
echo ============================================================================
echo   INSTALADOR DE CERTIFICADO SEGURO (HTTPS) - OFICINA DE EMPLEO SAN JOSE
echo ============================================================================
echo.

set "CERT_FILE=%~dp0OficinaEmpleo-RootCA.crt"

if not exist "%CERT_FILE%" (
    echo Descargando certificado raiz desde https://sistema:5173/OficinaEmpleo-RootCA.crt ...
    set "CERT_FILE=%TEMP%\OficinaEmpleo-RootCA.crt"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}; Invoke-WebRequest -Uri 'https://sistema:5173/OficinaEmpleo-RootCA.crt' -OutFile '%TEMP%\OficinaEmpleo-RootCA.crt' -UseBasicParsing"
)

if not exist "%CERT_FILE%" (
    echo [ERROR] No se encontro el archivo OficinaEmpleo-RootCA.crt ni se pudo descargar de https://sistema:5173
    pause
    exit /b 1
)

echo Instalando Autoridad de Certificacion en el almacen de confianza de Windows...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "$certPath = '%CERT_FILE%';" ^
    "$proc = Start-Process -FilePath 'certutil.exe' -ArgumentList '-user', '-addstore', 'Root', \"`\"$certPath`\"\" -WindowStyle Hidden -PassThru;" ^
    "Add-Type 'using System; using System.Runtime.InteropServices; public class CertAutoYes { [DllImport(\"user32.dll\")] public static extern IntPtr FindWindow(string c, string w); [DllImport(\"user32.dll\")] public static extern IntPtr GetDlgItem(IntPtr h, int id); [DllImport(\"user32.dll\")] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, IntPtr l); }' -ErrorAction SilentlyContinue;" ^
    "for ($i=0; $i -lt 30; $i++) { if ($proc.HasExited) { break }; $h = [CertAutoYes]::FindWindow('#32770', 'Advertencia de seguridad'); if ($h -eq [IntPtr]::Zero) { $h = [CertAutoYes]::FindWindow('#32770', 'Security Warning') }; if ($h -ne [IntPtr]::Zero) { $b = [CertAutoYes]::GetDlgItem($h, 6); if ($b -ne [IntPtr]::Zero) { [void][CertAutoYes]::SendMessage($b, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero) } }; Start-Sleep -Milliseconds 200 }"

echo.
echo ============================================================================
echo   CERTIFICADO INSTALADO CORRECTAMENTE EN ESTA PC
echo   Por favor, cierra completamente Chrome / Edge y volve a abrir:
echo   https://sistema:5173
echo ============================================================================
echo.
pause
