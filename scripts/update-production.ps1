# ==============================================================================
# Despliegue Continuo Local (CD) - Bolsa de Trabajo San José
# 1. Respalda la BD -> 2. git pull -> 3. Recompila Backend/Frontend -> 4. Reinicia
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoRoot = "C:\Apps\Bolsa-de-trabajo"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:LOCALAPPDATA\Programs\nodejs;$env:LOCALAPPDATA\Programs\mariadb\bin;$env:LOCALAPPDATA\Programs\git\cmd;$env:LOCALAPPDATA\Programs\gh\bin;$env:PATH"

Set-Location $RepoRoot

Write-Host "[1/5] Generando respaldo preventivo de la Base de Datos..." -ForegroundColor Cyan
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\backup-db.ps1" -Force

Write-Host "[2/5] Descargando últimos cambios desde GitHub (main)..." -ForegroundColor Cyan
git pull origin main

Write-Host "[3/5] Deteniendo Backend (8080) y Frontend (5173) para actualizar..." -ForegroundColor Cyan
schtasks.exe /Change /TN "BolsaTrabajoWatchdog" /DISABLE 2>$null | Out-Null
foreach ($p in @(8080, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($procId in ($conns.OwningProcess | Select-Object -Unique)) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 2

Write-Host "[4/5] Compilando artefacto de producción Backend (.jar)..." -ForegroundColor Cyan
Set-Location "$RepoRoot\backend"
.\mvnw.cmd package -DskipTests -q
if ($LASTEXITCODE -ne 0) {
    schtasks.exe /Change /TN "BolsaTrabajoWatchdog" /ENABLE 2>$null | Out-Null
    throw "Error al compilar el Backend."
}

Write-Host "[5/5] Reiniciando servicios en modo Servidor LAN..." -ForegroundColor Cyan
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = 'wscript.exe "C:\Apps\Bolsa-de-trabajo\scripts\iniciar-oculto.vbs"'
} | Out-Null
schtasks.exe /Change /TN "BolsaTrabajoWatchdog" /ENABLE 2>$null | Out-Null

for ($i = 0; $i -lt 25; $i++) {
    $ok3306 = $null -ne (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue)
    $ok8080 = $null -ne (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)
    $ok5173 = $null -ne (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
    if ($ok3306 -and $ok8080 -and $ok5173) {
        Write-Host ""
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host " ACTUALIZACIÓN COMPLETADA Y SERVICIOS ACTIVOS (http://sistema:5173)" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds 1
}

Write-Warning "El inicio está demorando más de lo habitual. Verifique logs/."
