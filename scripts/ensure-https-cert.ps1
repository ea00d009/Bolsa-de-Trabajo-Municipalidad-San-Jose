# ==============================================================================
# Gestión Automática de Certificados SSL/HTTPS para Red LAN (sistema / localhost)
# Genera una Autoridad Raíz Local (10 años) y un Certificado de Servidor (397 días)
# ==============================================================================

param(
    [switch]$InstallRootCA
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CertsDir = Join-Path $RepoRoot "certs"

if (-not (Test-Path $CertsDir)) {
    New-Item -ItemType Directory -Path $CertsDir -Force | Out-Null
}

$RootPfxPath = Join-Path $CertsDir "OficinaEmpleo-RootCA.pfx"
$RootCrtPath = Join-Path $CertsDir "OficinaEmpleo-RootCA.crt"
$LeafCrtPath = Join-Path $CertsDir "sistema.crt"
$LeafKeyPath = Join-Path $CertsDir "sistema.key"
$PfxPassword = "OficinaEmpleoSanJoseRootCA"

function New-ExportableRsaKey([int]$KeySize = 2048) {
    $params = New-Object System.Security.Cryptography.CngKeyCreationParameters
    $params.ExportPolicy = [System.Security.Cryptography.CngExportPolicies]::AllowPlaintextExport
    $params.KeyUsage = [System.Security.Cryptography.CngKeyUsages]::AllUsages
    $cngKey = [System.Security.Cryptography.CngKey]::Create(
        [System.Security.Cryptography.CngAlgorithm]::Rsa,
        [NullString]::Value,
        $params
    )
    return New-Object System.Security.Cryptography.RSACng($cngKey)
}

function Export-CertToPem([System.Security.Cryptography.X509Certificates.X509Certificate2]$Cert) {
    $derBytes = $Cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    return "-----BEGIN CERTIFICATE-----`r`n" +
           [Convert]::ToBase64String($derBytes, [Base64FormattingOptions]::InsertLineBreaks) +
           "`r`n-----END CERTIFICATE-----`r`n"
}

function Export-RsaKeyToPem([System.Security.Cryptography.RSACng]$Rsa) {
    $pkcs8Bytes = $Rsa.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
    return "-----BEGIN PRIVATE KEY-----`r`n" +
           [Convert]::ToBase64String($pkcs8Bytes, [Base64FormattingOptions]::InsertLineBreaks) +
           "`r`n-----END PRIVATE KEY-----`r`n"
}

# 1. Cargar o generar la Autoridad de Certificación Raíz (Root CA) de 10 años
$rootCert = $null
if (Test-Path $RootPfxPath) {
    try {
        $rootCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(
            $RootPfxPath,
            $PfxPassword,
            [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
        )
    } catch {
        $rootCert = $null
    }
}

if ($null -eq $rootCert) {
    Write-Host "Generando Autoridad de Certificacion Raiz Local (Oficina de Empleo San Jose)..." -ForegroundColor Cyan
    $rootRsa = New-ExportableRsaKey 2048
    $rootSubject = New-Object System.Security.Cryptography.X509Certificates.X500DistinguishedName(
        "CN=Oficina de Empleo San Jose - Root CA, O=Municipalidad de San Jose, C=AR"
    )
    $rootReq = New-Object System.Security.Cryptography.X509Certificates.CertificateRequest(
        $rootSubject,
        $rootRsa,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
    )

    # Extensiones de Autoridad Certificadora (CA=TRUE)
    $rootReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension($true, $false, 0, $true))
    )
    $rootReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509KeyUsageExtension(
            ([System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyCertSign -bor
             [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::CrlSign),
            $true
        ))
    )
    $rootReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509SubjectKeyIdentifierExtension($rootReq.PublicKey, $false))
    )

    $notBefore = [DateTimeOffset]::UtcNow.AddDays(-1)
    $notAfter  = [DateTimeOffset]::UtcNow.AddYears(10)
    $rootCert  = $rootReq.CreateSelfSigned($notBefore, $notAfter)
    $rootCert.FriendlyName = "Oficina de Empleo San Jose - Root CA"

    $pfxBytes = $rootCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, $PfxPassword)
    [System.IO.File]::WriteAllBytes($RootPfxPath, $pfxBytes)
}

# Exportar siempre el archivo público .crt de la Root CA
$rootPem = Export-CertToPem $rootCert
[System.IO.File]::WriteAllText($RootCrtPath, $rootPem, [System.Text.Encoding]::ASCII)

# Copiar también a frontend/public para facilitar descarga en la red LAN
$PublicDir = Join-Path $RepoRoot "frontend\public"
if (Test-Path $PublicDir) {
    Copy-Item -Path $RootCrtPath -Destination (Join-Path $PublicDir "OficinaEmpleo-RootCA.crt") -Force
}

# 2. Obtener todas las IPs locales activas y nombres de host
$localIps = @(
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -ExpandProperty IPAddress
)
$currentHostname = ($env:COMPUTERNAME).ToLower()

# 3. Verificar si el certificado del servidor (sistema.crt) existe, es válido y contiene las IPs actuales
$needsNewLeaf = $true
if ((Test-Path $LeafCrtPath) -and (Test-Path $LeafKeyPath)) {
    try {
        $existingLeaf = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($LeafCrtPath)
        $daysLeft = ($existingLeaf.NotAfter - (Get-Date)).TotalDays
        $sanExt = $existingLeaf.Extensions | Where-Object { $_.Oid.Value -eq "2.5.29.17" }
        $sanText = if ($sanExt) { $sanExt.Format($true) } else { "" }

        $allIpsPresent = $true
        foreach ($ip in $localIps) {
            if ($sanText -notmatch [Regex]::Escape($ip)) {
                $allIpsPresent = $false
                break
            }
        }

        if ($daysLeft -gt 30 -and $allIpsPresent) {
            $needsNewLeaf = $false
        }
    } catch {
        $needsNewLeaf = $true
    }
}

if ($needsNewLeaf) {
    Write-Host "Generando certificado SSL para servidor (sistema, localhost, $($localIps -join ', '))..." -ForegroundColor Cyan
    $leafRsa = New-ExportableRsaKey 2048
    $leafSubject = New-Object System.Security.Cryptography.X509Certificates.X500DistinguishedName(
        "CN=sistema, O=Municipalidad de San Jose, C=AR"
    )
    $leafReq = New-Object System.Security.Cryptography.X509Certificates.CertificateRequest(
        $leafSubject,
        $leafRsa,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
    )

    # Extensiones de Certificado de Servidor TLS (CA=FALSE, ServerAuth, SAN)
    $leafReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension($false, $false, 0, $true))
    )
    $leafReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509KeyUsageExtension(
            ([System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor
             [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment),
            $true
        ))
    )

    $ekuOids = New-Object System.Security.Cryptography.OidCollection
    [void]$ekuOids.Add((New-Object System.Security.Cryptography.Oid("1.3.6.1.5.5.7.3.1", "Server Authentication")))
    $leafReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension($ekuOids, $false))
    )
    $leafReq.CertificateExtensions.Add(
        (New-Object System.Security.Cryptography.X509Certificates.X509SubjectKeyIdentifierExtension($leafReq.PublicKey, $false))
    )

    # Subject Alternative Names (SAN)
    $sanBuilder = New-Object System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder
    $sanBuilder.AddDnsName("sistema")
    $sanBuilder.AddDnsName("sistema.local")
    $sanBuilder.AddDnsName("localhost")
    if ($currentHostname -and $currentHostname -ne "sistema") {
        $sanBuilder.AddDnsName($currentHostname)
    }
    $sanBuilder.AddIpAddress([System.Net.IPAddress]::Parse("127.0.0.1"))
    $sanBuilder.AddIpAddress([System.Net.IPAddress]::Parse("::1"))
    foreach ($ip in $localIps) {
        $parsedIp = $null
        if ([System.Net.IPAddress]::TryParse($ip, [ref]$parsedIp)) {
            $sanBuilder.AddIpAddress($parsedIp)
        }
    }
    $leafReq.CertificateExtensions.Add($sanBuilder.Build())

    $serialBytes = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($serialBytes)
    $serialBytes[0] = $serialBytes[0] -band 0x7F

    $leafNotBefore = [DateTimeOffset]::UtcNow.AddDays(-1)
    $leafNotAfter  = [DateTimeOffset]::UtcNow.AddDays(397) # <= 398 días exigido por Chrome/Edge
    $leafCert = $leafReq.Create($rootCert, $leafNotBefore, $leafNotAfter, $serialBytes)

    $leafPem = (Export-CertToPem $leafCert) + (Export-CertToPem $rootCert)
    $keyPem  = Export-RsaKeyToPem $leafRsa

    [System.IO.File]::WriteAllText($LeafCrtPath, $leafPem, [System.Text.Encoding]::ASCII)
    [System.IO.File]::WriteAllText($LeafKeyPath, $keyPem, [System.Text.Encoding]::ASCII)
    Write-Host "Certificado SSL generado exitosamente en $CertsDir" -ForegroundColor Green
}

# 4. Instalar la Root CA en el almacén de confianza de Windows si se solicita y aún no está instalada
if ($InstallRootCA) {
    $thumbprint = $rootCert.Thumbprint
    $installedInUser = Get-ChildItem "Cert:\CurrentUser\Root" -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -eq $thumbprint }
    $installedInMachine = Get-ChildItem "Cert:\LocalMachine\Root" -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -eq $thumbprint }

    if (-not $installedInUser -and -not $installedInMachine) {
        Write-Host "Instalando Autoridad Raiz en el almacen de confianza de Windows..." -ForegroundColor Yellow
        $proc = Start-Process -FilePath "certutil.exe" -ArgumentList "-user", "-addstore", "Root", "`"$RootCrtPath`"" -WindowStyle Hidden -PassThru
        try {
            Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32CertClicker {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetDlgItem(IntPtr hDlg, int nIDDlgItem);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
}
"@ -ErrorAction SilentlyContinue
            for ($i = 0; $i -lt 25; $i++) {
                if ($proc.HasExited) { break }
                $hwnd = [Win32CertClicker]::FindWindow("#32770", "Advertencia de seguridad")
                if ($hwnd -eq [IntPtr]::Zero) {
                    $hwnd = [Win32CertClicker]::FindWindow("#32770", "Security Warning")
                }
                if ($hwnd -ne [IntPtr]::Zero) {
                    $btnYes = [Win32CertClicker]::GetDlgItem($hwnd, 6)
                    if ($btnYes -ne [IntPtr]::Zero) {
                        [void][Win32CertClicker]::SendMessage($btnYes, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero)
                    }
                }
                Start-Sleep -Milliseconds 200
            }
        } catch {}
        Write-Host "Autoridad Raiz instalada correctamente." -ForegroundColor Green
    } else {
        Write-Host "La Autoridad Raiz ya se encuentra instalada en Windows ($thumbprint)." -ForegroundColor Green
    }
}
