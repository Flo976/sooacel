# =============================================================================
# Sooacel — install.ps1
# Setup script for Windows PowerShell: installs sooacel CLI and configures
# PowerShell profile with sooacel function
# =============================================================================

$ErrorActionPreference = 'Stop'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoDir     = Split-Path -Parent $ScriptDir
$SooacelDir  = Join-Path $HOME '.sooacel'
$EnvFile     = Join-Path $SooacelDir '.env'
$EnvTemplate = Join-Path $ScriptDir '.env.template'
$MarkerStart = '# --- Sooacel: Vercel Env Manager ---'
$MarkerEnd   = '# --- Fin Sooacel ---'

# -----------------------------------------------------------------------------
# 1. Check Node.js >= 18
# -----------------------------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "ERROR: Node.js is not installed. Please install Node.js >= 18 before running this script.`n       https://nodejs.org/"
    exit 1
}

$nodeVersionRaw = (node --version).Trim()
$nodeMajor = [int]($nodeVersionRaw.TrimStart('v').Split('.')[0])

if ($nodeMajor -lt 18) {
    Write-Error "ERROR: Node.js >= 18 is required. Found: $nodeVersionRaw`n       https://nodejs.org/"
    exit 1
}

Write-Host "Node.js found: $nodeVersionRaw"

# -----------------------------------------------------------------------------
# 2. Create ~/.sooacel/ if absent
# -----------------------------------------------------------------------------
if (-not (Test-Path $SooacelDir)) {
    New-Item -ItemType Directory -Path $SooacelDir | Out-Null
    Write-Host "Directory created: $SooacelDir"
} else {
    Write-Host "Directory already exists: $SooacelDir"
}

# -----------------------------------------------------------------------------
# 3. Copy .env.template to ~/.sooacel/.env if absent (never overwrite)
# -----------------------------------------------------------------------------
if (-not (Test-Path $EnvFile)) {
    Copy-Item -Path $EnvTemplate -Destination $EnvFile
    Write-Host "Env file created: $EnvFile"
} else {
    Write-Host "Env file already exists, skipping copy: $EnvFile"
}

# -----------------------------------------------------------------------------
# 4. Run npm install in the repo directory
# -----------------------------------------------------------------------------
Write-Host "Running npm install in $RepoDir ..."
Push-Location $RepoDir
try {
    npm install
} finally {
    Pop-Location
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
    # 7. Append function block to $PROFILE
    # -------------------------------------------------------------------------
    $sooacelJs = Join-Path $RepoDir 'bin\sooacel.js'
    $block = @"

# --- Sooacel: Vercel Env Manager ---
function sooacel { node "$sooacelJs" @args }
# --- Fin Sooacel ---
"@

    Add-Content -Path $PROFILE -Value $block
    Write-Host "Sooacel function appended to $PROFILE"
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
Write-Host "  Function installed:"
Write-Host "    sooacel"
Write-Host ""
Write-Host "  To activate now, reload your profile:"
Write-Host "    . `$PROFILE"
Write-Host ""
