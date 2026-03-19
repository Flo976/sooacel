#!/usr/bin/env bash
# =============================================================================
# Sooacel — install.sh
# Setup script for Linux/macOS: installs sooacel CLI and configures shell alias
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
ENV_TEMPLATE="$SCRIPT_DIR/.env.template"
SOOACEL_DIR="$HOME/.sooacel"
ENV_FILE="$SOOACEL_DIR/.env"
MARKER_START="# --- Sooacel: Vercel Env Manager ---"
MARKER_END="# --- Fin Sooacel ---"

# -----------------------------------------------------------------------------
# 1. Check Node.js >= 18
# -----------------------------------------------------------------------------
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js >= 18 before running this script."
    echo "       https://nodejs.org/"
    exit 1
fi

NODE_VERSION_RAW="$(node --version)"
NODE_MAJOR="${NODE_VERSION_RAW#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "ERROR: Node.js >= 18 is required. Found: $NODE_VERSION_RAW"
    echo "       https://nodejs.org/"
    exit 1
fi

echo "Node.js found: $NODE_VERSION_RAW"

# -----------------------------------------------------------------------------
# 2. Create ~/.sooacel/ with secure permissions
# -----------------------------------------------------------------------------
mkdir -p "$SOOACEL_DIR"
chmod 700 "$SOOACEL_DIR"
echo "Directory ready: $SOOACEL_DIR"

# -----------------------------------------------------------------------------
# 3. Copy .env.template to ~/.sooacel/.env if not already present (never overwrite)
# -----------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Env file created: $ENV_FILE"
else
    echo "Env file already exists, skipping copy: $ENV_FILE"
fi

# -----------------------------------------------------------------------------
# 4. Run npm install in the repo directory
# -----------------------------------------------------------------------------
echo "Running npm install in $REPO_DIR ..."
npm install --prefix "$REPO_DIR"

# -----------------------------------------------------------------------------
# 5. Detect shell and determine rc file
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
# 6. Check if sooacel block is already present (idempotent)
# -----------------------------------------------------------------------------
if grep -qF "$MARKER_START" "$RC_FILE" 2>/dev/null; then
    echo "Sooacel block already present in $RC_FILE — skipping."
else
    # -------------------------------------------------------------------------
    # 7. Append alias block to rc file
    # -------------------------------------------------------------------------
    cat >> "$RC_FILE" << EOF

# --- Sooacel: Vercel Env Manager ---
alias sooacel="$REPO_DIR/bin/sooacel.js"
# --- Fin Sooacel ---
EOF
    echo "Sooacel alias appended to $RC_FILE"
fi

# -----------------------------------------------------------------------------
# 8. Print summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================="
echo "  Sooacel setup complete!"
echo "============================================="
echo ""
echo "  Fill in your Vercel tokens in:"
echo "    $ENV_FILE"
echo ""
echo "  Alias installed:"
echo "    sooacel"
echo ""
echo "  To activate now, reload your shell:"
echo "    source $RC_FILE"
echo ""
