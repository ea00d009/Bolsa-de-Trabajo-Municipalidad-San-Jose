# ==============================================================================
# Inicio Automático en Segundo Plano - Bolsa de Trabajo San José
# Levanta MariaDB (3306), Backend Spring Boot (8080) y Frontend Vite (5173)
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"
$RepoRoot = "C:\Apps\Bolsa-de-trabajo"
$LogsDir  = Join-Path $RepoRoot "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$NodeDir       = "$env:LOCALAPPDATA\Programs\nodejs"
$MariaDir      = "$env:LOCALAPPDATA\Programs\mariadb"
$env:Path      = "$env:JAVA_HOME\bin;$NodeDir;$MariaDir\bin;$env:Path"

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

# 1. Iniciar MariaDB (Puerto 3306)
if (-not (Test-PortListening 3306)) {
    $mysqld = Join-Path $MariaDir "bin\mysqld.exe"
    $dataDir = Join-Path $MariaDir "data"
    if (Test-Path $mysqld) {
        Start-Process -FilePath $mysqld `
            -ArgumentList "--datadir=`"$dataDir`"", "--port=3306" `
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

# 4. Iniciar Frontend React + Vite (Puerto 5173)
if (-not (Test-PortListening 5173)) {
    $frontendDir = Join-Path $RepoRoot "frontend"
    $npmCmd      = Join-Path $NodeDir "npm.cmd"
    if (-not (Test-Path $npmCmd)) { $npmCmd = "npm.cmd" }

    Start-Process -FilePath $npmCmd `
        -ArgumentList "run", "dev" `
        -WorkingDirectory $frontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogsDir "frontend.log") `
        -RedirectStandardError  (Join-Path $LogsDir "frontend-error.log")
}
