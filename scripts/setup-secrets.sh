#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# scripts/setup-secrets.sh
# Push all server-side secrets to Firebase Secret Manager from your local .env
#
# Usage:
#   chmod +x scripts/setup-secrets.sh
#   ./scripts/setup-secrets.sh
#
# Prerequisites:
#   - firebase CLI installed and logged in
#   - .env file in project root with all required keys
#   - firebase use pawprint-50 (or your project)
#
# NEVER commit this script with real values embedded — it reads from .env
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in your values first."
  exit 1
fi

# Load .env (skip comments and empty lines)
set -o allexport
# shellcheck disable=SC1090
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$')
set +o allexport

echo "==> Setting Firebase server-side secrets from .env"
echo "    These are stored in GCP Secret Manager and NEVER leave the server."
echo ""

push_secret() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" || "$value" == *_here* ]]; then
    echo "  SKIP  $name (not set or still placeholder)"
    return
  fi
  echo "  SET   $name"
  printf '%s' "$value" | firebase functions:secrets:set "$name" --data-file=-
}

push_secret GEMINI_API_KEY
push_secret OPENROUTER_API_KEY
push_secret STRIPE_SECRET_KEY
push_secret STRIPE_WEBHOOK_SECRET
push_secret GENESIS_KEY_HASH

echo ""
echo "✓ Done. Verify with: firebase functions:secrets:access SECRET_NAME"
echo ""
echo "REMINDER: Restrict your Firebase API key to your domains in GCP Console:"
echo "  GCP Console → APIs & Services → Credentials → API key → Application restrictions"
echo "  Allowed referrers: pawprint-50.web.app, pawprintfind.com, localhost"
