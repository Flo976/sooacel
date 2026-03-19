#!/usr/bin/env bash
# =============================================================================
# Sooacel — install.sh
# Setup script for Linux/macOS: installs Vercel CLI and configures shell aliases
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_TEMPLATE="$SCRIPT_DIR/.env.template"
SOOACEL_DIR="$HOME/.sooacel"
ENV_FILE="$SOOACEL_DIR/.env"
MARKER_START="# --- Sooacel: Vercel Env Manager ---"
MARKER_END="# --- Fin Sooacel ---"

# -----------------------------------------------------------------------------
# 1. Verify Node.js is installed
# -----------------------------------------------------------------------------
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js before running this script."
    echo "       https://nodejs.org/"
    exit 1
fi

echo "Node.js found: $(node --version)"

# -----------------------------------------------------------------------------
# 2. Verify/install Vercel CLI
# -----------------------------------------------------------------------------
if ! command -v vercel &>/dev/null; then
    echo "Vercel CLI not found. Installing via npm..."
    npm i -g vercel
else
    echo "Vercel CLI found: $(vercel --version 2>/dev/null || echo 'unknown version')"
fi

# -----------------------------------------------------------------------------
# 3. Create ~/.sooacel/ with secure permissions
# -----------------------------------------------------------------------------
mkdir -p "$SOOACEL_DIR"
chmod 700 "$SOOACEL_DIR"
echo "Directory created: $SOOACEL_DIR"

# -----------------------------------------------------------------------------
# 4. Copy .env.template to ~/.sooacel/.env if not already present
# -----------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    echo "Env file created: $ENV_FILE"
else
    echo "Env file already exists, skipping copy: $ENV_FILE"
fi

# -----------------------------------------------------------------------------
# 5. Set secure permissions on .env
# -----------------------------------------------------------------------------
chmod 600 "$ENV_FILE"

# -----------------------------------------------------------------------------
# 6. Detect shell and determine rc file
# -----------------------------------------------------------------------------
SHELL_NAME="$(basename "$SHELL")"
case "$SHELL_NAME" in
    bash)
        RC_FILE="$HOME/.bashrc"
        ;;
    zsh)
        RC_FILE="$HOME/.zshrc"
        ;;
    *)
        echo "WARNING: Unsupported shell '$SHELL_NAME'. Falling back to ~/.bashrc."
        RC_FILE="$HOME/.bashrc"
        ;;
esac

# -----------------------------------------------------------------------------
# 7. Check if sooacel block is already present (idempotent)
# -----------------------------------------------------------------------------
if grep -qF "$MARKER_START" "$RC_FILE" 2>/dev/null; then
    echo "Sooacel block already present in $RC_FILE — skipping."
else
    # -------------------------------------------------------------------------
    # 8. Append aliases block to rc file
    # -------------------------------------------------------------------------
    cat >> "$RC_FILE" << 'EOF'

# --- Sooacel: Vercel Env Manager ---
if [ -f ~/.sooacel/.env ]; then
    source ~/.sooacel/.env
fi

ve-dexyu()  { VERCEL_TOKEN="$VERCEL_TOKEN_DEXYU" vercel --scope "$VERCEL_TEAM_DEXYU" "$@"; }
ve-eanet()  { VERCEL_TOKEN="$VERCEL_TOKEN_EANET" vercel "$@"; }
ve-theo()   { VERCEL_TOKEN="$VERCEL_TOKEN_THEO" vercel "$@"; }
ve-sooatek(){ VERCEL_TOKEN="$VERCEL_TOKEN_SOOATEK" vercel "$@"; }
# --- Fin Sooacel ---
EOF
    echo "Sooacel block appended to $RC_FILE"
fi

# -----------------------------------------------------------------------------
# 9. Print summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================="
echo "  Sooacel setup complete!"
echo "============================================="
echo ""
echo "  Fill in your Vercel tokens in:"
echo "    $ENV_FILE"
echo ""
echo "  Aliases installed:"
echo "    ve-dexyu   — Vercel account: DEXYU (team scope)"
echo "    ve-eanet   — Vercel account: EANET"
echo "    ve-theo    — Vercel account: THEO"
echo "    ve-sooatek — Vercel account: SOOATEK"
echo ""
echo "  To activate now, reload your shell:"
echo "    source $RC_FILE"
echo ""
