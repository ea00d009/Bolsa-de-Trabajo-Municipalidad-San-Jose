# ==============================================================================
# Respaldo Automático de Base de Datos - Bolsa de Trabajo San José
# Genera un dump SQL diario en database/backups_locales/ y conserva los últimos 30
# ==============================================================================

param(
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"
$RepoRoot   = "C:\Apps\Bolsa-de-trabajo"
$BackupDir  = Join-Path $RepoRoot "database\backups_locales"
$MariaDir   = "$env:LOCALAPPDATA\Programs\mariadb"
$mysqldump  = Join-Path $MariaDir "bin\mysqldump.exe"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (-not (Test-Path $mysqldump)) {
    Write-Error "No se encontró mysqldump.exe en $mysqldump"
    exit 1
}

$dateStamp  = Get-Date -Format "yyyy-MM-dd"
$timeStamp  = Get-Date -Format "yyyy-MM-dd_HH-mm"
$dailyFile  = Join-Path $BackupDir "backup_automatico_$dateStamp.sql"
$manualFile = Join-Path $BackupDir "backup_manual_$timeStamp.sql"

$targetFile = if ($Force) { $manualFile } else { $dailyFile }

if ((-not $Force) -and (Test-Path $dailyFile) -and ((Get-Item $dailyFile).Length -gt 1024)) {
    Write-Output "El respaldo diario de hoy ($dailyFile) ya existe."
    exit 0
}

& $mysqldump -u root --host=127.0.0.1 --port=3306 --single-transaction --routines --triggers --default-character-set=utf8mb4 oficina_empleo_sanjose --result-file="$targetFile"

if ((Test-Path $targetFile) -and ((Get-Item $targetFile).Length -gt 1024)) {
    Write-Output "Respaldo generado exitosamente: $targetFile"

    # Conservar los últimos 30 respaldos automáticos para no llenar el disco
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_automatico_*.sql" |
                  Sort-Object LastWriteTime -Descending |
                  Select-Object -Skip 30
    foreach ($old in $oldBackups) {
        Remove-Item $old.FullName -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Error "No se pudo generar el respaldo o el archivo quedó vacío."
    exit 1
}
