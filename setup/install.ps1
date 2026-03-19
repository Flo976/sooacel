# =============================================================================
# Sooacel — install.ps1
# Setup script for Windows PowerShell: installs Vercel CLI and configures
# PowerShell profile with Vercel account functions
# =============================================================================

$ErrorActionPreference = 'Stop'

$SooacelDir = Join-Path $HOME '.sooacel'
$EnvFile    = Join-Path $SooacelDir '.env'
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvTemplate = Join-Path $ScriptDir '.env.template'
$MarkerStart = '# --- Sooacel: Vercel Env Manager ---'
$MarkerEnd   = '# --- Fin Sooacel ---'

# -----------------------------------------------------------------------------
# 1. Verify Node.js is installed
# -----------------------------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "ERROR: Node.js is not installed. Please install Node.js before running this script.`n       https://nodejs.org/"
    exit 1
}

Write-Host "Node.js found: $(node --version)"

# -----------------------------------------------------------------------------
# 2. Verify/install Vercel CLI
# -----------------------------------------------------------------------------
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing via npm..."
    npm i -g vercel
} else {
    $vercelVersion = (vercel --version 2>$null) -join ''
    Write-Host "Vercel CLI found: $vercelVersion"
}

# -----------------------------------------------------------------------------
# 3. Create ~/.sooacel/ if absent
# -----------------------------------------------------------------------------
if (-not (Test-Path $SooacelDir)) {
    New-Item -ItemType Directory -Path $SooacelDir | Out-Null
    Write-Host "Directory created: $SooacelDir"
} else {
    Write-Host "Directory already exists: $SooacelDir"
}

# -----------------------------------------------------------------------------
# 4. Copy .env.template to ~/.sooacel/.env if absent (never overwrite)
# -----------------------------------------------------------------------------
if (-not (Test-Path $EnvFile)) {
    Copy-Item -Path $EnvTemplate -Destination $EnvFile
    Write-Host "Env file created: $EnvFile"
} else {
    Write-Host "Env file already exists, skipping copy: $EnvFile"
}

# -----------------------------------------------------------------------------
# 5. Ensure $PROFILE exists
# -----------------------------------------------------------------------------
if (-not (Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
    Write-Host "PowerShell profile created: $PROFILE"
} else {
    Write-Host "PowerShell profile found: $PROFILE"
}

# -----------------------------------------------------------------------------
# 6. Check if sooacel block is already present (idempotent)
# -----------------------------------------------------------------------------
$profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($profileContent -and $profileContent.Contains($MarkerStart)) {
    Write-Host "Sooacel block already present in profile — skipping."
} else {
    # -------------------------------------------------------------------------
    # 7. Append functions block to $PROFILE
    # -------------------------------------------------------------------------
    $block = @'

# --- Sooacel: Vercel Env Manager ---
if (Test-Path ~/.sooacel/.env) {
    Get-Content ~/.sooacel/.env | ForEach-Object {
        if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
        }
    }
}

function ve-dexyu {
    $prev = $env:VERCEL_TOKEN
    try { $env:VERCEL_TOKEN = $env:VERCEL_TOKEN_DEXYU; vercel --scope $env:VERCEL_TEAM_DEXYU @args }
    finally { $env:VERCEL_TOKEN = $prev }
}
function ve-eanet {
    $prev = $env:VERCEL_TOKEN
    try { $env:VERCEL_TOKEN = $env:VERCEL_TOKEN_EANET; vercel @args }
    finally { $env:VERCEL_TOKEN = $prev }
}
function ve-theo {
    $prev = $env:VERCEL_TOKEN
    try { $env:VERCEL_TOKEN = $env:VERCEL_TOKEN_THEO; vercel @args }
    finally { $env:VERCEL_TOKEN = $prev }
}
function ve-sooatek {
    $prev = $env:VERCEL_TOKEN
    try { $env:VERCEL_TOKEN = $env:VERCEL_TOKEN_SOOATEK; vercel @args }
    finally { $env:VERCEL_TOKEN = $prev }
}
# --- Fin Sooacel ---
'@

    Add-Content -Path $PROFILE -Value $block
    Write-Host "Sooacel block appended to $PROFILE"
}

# -----------------------------------------------------------------------------
# 8. Print summary
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================="
Write-Host "  Sooacel setup complete!"
Write-Host "============================================="
Write-Host ""
Write-Host "  Fill in your Vercel tokens in:"
Write-Host "    $EnvFile"
Write-Host ""
Write-Host "  Functions installed:"
Write-Host "    ve-dexyu   — Vercel account: DEXYU (team scope)"
Write-Host "    ve-eanet   — Vercel account: EANET"
Write-Host "    ve-theo    — Vercel account: THEO"
Write-Host "    ve-sooatek — Vercel account: SOOATEK"
Write-Host ""
Write-Host "  To activate now, reload your profile:"
Write-Host "    . `$PROFILE"
Write-Host ""
