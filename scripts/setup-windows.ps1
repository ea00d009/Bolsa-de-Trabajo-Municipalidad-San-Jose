# ==============================================================================
# Script de Instalación y Configuración Automática - Bolsa de Trabajo San José
# Compatible con Windows 10 / Windows 11 (PowerShell)
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Bolsa de Trabajo San Jose - Setup Automatico" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = Get-Location }

# 1. Comprobar Node.js
Write-Host "`n[1/5] Verificando Node.js..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  -> Node.js no encontrado. Instalando Node.js LTS via winget..." -ForegroundColor Magenta
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    $nodeVer = node -v
    Write-Host "  -> Node.js ya esta instalado: $nodeVer" -ForegroundColor Green
}

# 2. Comprobar Java 21+
Write-Host "`n[2/5] Verificando Java (JDK 21+)..." -ForegroundColor Yellow
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
$needJava = $false
if (-not $javaCmd) {
    $needJava = $true
} else {
    $javaVerStr = java -version 2>&1 | Select-String -Pattern "version" | Out-String
    Write-Host "  -> Java detectado: $javaVerStr" -ForegroundColor Green
    if ($javaVerStr -match '"(\d+)') {
        $majorVer = [int]$matches[1]
        if ($majorVer -lt 17) {
            Write-Host "  -> La version actual es inferior a Java 17 (requerida 21+). Se instalara JDK 21." -ForegroundColor Magenta
            $needJava = $true
        }
    }
}

if ($needJava) {
    Write-Host "  -> Instalando Microsoft OpenJDK 21 via winget..." -ForegroundColor Magenta
    winget install --id Microsoft.OpenJDK.21 -e --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 3. Comprobar / Configurar Base de Datos MySQL
Write-Host "`n[3/5] Verificando Base de Datos..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
$mysqlService = Get-Service *mysql*,*mariadb* -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" } | Select-Object -First 1

if ($dockerCmd) {
    Write-Host "  -> Docker detectado. Desplegando contenedor MySQL (oficina_empleo_sanjose)..." -ForegroundColor Green
    docker compose up -d mysql
    Write-Host "  -> Contenedor MySQL levantado e inicializado en puerto 3306." -ForegroundColor Green
} elseif ($mysqlService) {
    Write-Host "  -> Servicio local detectado: $($mysqlService.DisplayName) ($($mysqlService.Status))" -ForegroundColor Green
} else {
    Write-Host "  -> No se detecto servicio MySQL activo ni Docker." -ForegroundColor Yellow
    Write-Host "     Opciones recomendadas:" -ForegroundColor Yellow
    Write-Host "     A) Si tenes Docker Desktop instalado, ejecutalo y volve a correr este script."
    Write-Host "     B) O instala MySQL Server / MariaDB con: winget install MariaDB.Server -e"
}

# 4. Configurar variables de entorno backend (.env)
Write-Host "`n[4/5] Configurando archivo backend/.env..." -ForegroundColor Yellow
$envPath = Join-Path $RepoRoot "backend\.env"
if (-not (Test-Path $envPath)) {
    $randomJwt = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
    $envContent = @"
# === Bolsa de Trabajo - Configuracion Local ===
DB_NAME=oficina_empleo_sanjose
DB_USERNAME=root
DB_PASSWORD=
JWT_SECRET=$randomJwt
ALLOWED_ORIGINS=http://localhost:5173
SWAGGER_ENABLED=false
"@
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "  -> Creado backend/.env con secreto JWT aleatorio generado localmente." -ForegroundColor Green
} else {
    Write-Host "  -> backend/.env ya existe. Conservado." -ForegroundColor Green
}

# 5. Instalar dependencias del frontend
Write-Host "`n[5/5] Instalando dependencias de frontend (npm install)..." -ForegroundColor Yellow
$frontendDir = Join-Path $RepoRoot "frontend"
if (Test-Path $frontendDir) {
    Push-Location $frontendDir
    npm install
    Pop-Location
    Write-Host "  -> Dependencias de frontend instaladas correctamente." -ForegroundColor Green
}

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host " Instalacion y preparacion finalizada con exito!" -ForegroundColor Green
Write-Host " Para iniciar el sistema:" -ForegroundColor Cyan
Write-Host "   1. Doble clic en iniciar.bat (o ejecuta .\iniciar.bat)" -ForegroundColor Yellow
Write-Host "   2. O con Docker: docker compose up -d" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
