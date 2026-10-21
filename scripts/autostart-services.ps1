# ==============================================================================
# Inicio Automático en Segundo Plano - Bolsa de Trabajo San José
# Levanta MariaDB (127.0.0.1:3306), Backend Spring Boot (8080) y Frontend LAN (0.0.0.0:5173)
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"
$RepoRoot = "C:\Apps\Bolsa-de-trabajo"
$LogsDir  = Join-Path $RepoRoot "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Evitar que la PC Servidor entre en suspensión automática mientras está enchufada
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
schtasks.exe /Change /TN "BolsaTrabajoWatchdog" /ENABLE 2>$null | Out-Null

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$NodeDir       = "$env:LOCALAPPDATA\Programs\nodejs"
$MariaDir      = "$env:LOCALAPPDATA\Programs\mariadb"
$env:Path      = "$env:JAVA_HOME\bin;$NodeDir;$MariaDir\bin;$env:Path"

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

# 1. Iniciar MariaDB (Puerto 3306 restringido a 127.0.0.1 por seguridad en LAN)
if (-not (Test-PortListening 3306)) {
    $mysqld = Join-Path $MariaDir "bin\mysqld.exe"
    $dataDir = Join-Path $MariaDir "data"
    if (Test-Path $mysqld) {
        Start-Process -FilePath $mysqld `
            -ArgumentList "--datadir=`"$dataDir`"", "--port=3306", "--bind-address=127.0.0.1" `
            -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $LogsDir "mariadb.log") `
            -RedirectStandardError  (Join-Path $LogsDir "mariadb-error.log")

        # Esperar hasta 25 segundos a que MariaDB acepte conexiones
        for ($i = 0; $i -lt 25; $i++) {
            if (Test-PortListening 3306) { break }
            Start-Sleep -Seconds 1
        }
    }
}

# 1.b Ejecutar respaldo diario automático si aún no se hizo hoy
$backupScript = Join-Path $RepoRoot "scripts\backup-db.ps1"
if ((Test-PortListening 3306) -and (Test-Path $backupScript)) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $backupScript | Out-Null
}

# 2. Cargar variables de entorno de backend/.env
$envFile = Join-Path $RepoRoot "backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

# 3. Iniciar Backend Spring Boot (Puerto 8080)
if (-not (Test-PortListening 8080)) {
    $backendDir = Join-Path $RepoRoot "backend"
    $jarFile    = Join-Path $backendDir "target\bolsatrabajo-0.0.1-SNAPSHOT.jar"
    $javaExe    = Join-Path $env:JAVA_HOME "bin\java.exe"

    if ((Test-Path $jarFile) -and (Test-Path $javaExe)) {
        Start-Process -FilePath $javaExe `
            -ArgumentList "-jar", "`"$jarFile`"" `
            -WorkingDirectory $backendDir `
            -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $LogsDir "backend.log") `
            -RedirectStandardError  (Join-Path $LogsDir "backend-error.log")
    } else {
        $mvnw = Join-Path $backendDir "mvnw.cmd"
        Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c", "`"$mvnw`" spring-boot:run" `
            -WorkingDirectory $backendDir `
            -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $LogsDir "backend.log") `
            -RedirectStandardError  (Join-Path $LogsDir "backend-error.log")
    }
}

# 3.b Asegurar certificados SSL/HTTPS locales vigentes para la red LAN
$certScript = Join-Path $RepoRoot "scripts\ensure-https-cert.ps1"
if (Test-Path $certScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $certScript -InstallRootCA | Out-Null
}

# 4. Iniciar Frontend React + Vite en modo LAN HTTPS (0.0.0.0:5173)
if (-not (Test-PortListening 5173)) {
    $frontendDir = Join-Path $RepoRoot "frontend"
    $npmCmd      = Join-Path $NodeDir "npm.cmd"
    if (-not (Test-Path $npmCmd)) { $npmCmd = "npm.cmd" }

    Start-Process -FilePath $npmCmd `
        -ArgumentList "run", "dev", "--", "--host" `
        -WorkingDirectory $frontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogsDir "frontend.log") `
        -RedirectStandardError  (Join-Path $LogsDir "frontend-error.log")
}
