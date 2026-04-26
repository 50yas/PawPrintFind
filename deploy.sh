#!/bin/bash
# =============================================================================
# PawPrintFind — Full Deployment Script
# Deploys to: GitHub + Firebase (Hosting + Functions + Rules) + Google Cloud
# =============================================================================
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

DEPLOY_GCLOUD=false
DEPLOY_FUNCTIONS=true
SKIP_BUILD=false

# Parse flags
for arg in "$@"; do
  case $arg in
    --gcloud)      DEPLOY_GCLOUD=true ;;
    --no-functions) DEPLOY_FUNCTIONS=false ;;
    --skip-build)  SKIP_BUILD=true ;;
    --help)
      echo "Usage: ./deploy.sh [options]"
      echo ""
      echo "Options:"
      echo "  --gcloud         Also deploy to Google App Engine"
      echo "  --no-functions   Skip Cloud Functions deploy"
      echo "  --skip-build     Skip npm build (use existing dist/)"
      echo "  --help           Show this help"
      exit 0
      ;;
  esac
done

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     PawPrintFind — Full Deployment       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Build ─────────────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  log "Building frontend (TypeScript + Vite)..."
  npm run build || err "Build failed — fix TypeScript errors before deploying"
  ok "Build complete"
else
  warn "Skipping build (--skip-build flag)"
fi

# ── 2. GitHub ─────────────────────────────────────────────────────────────────
log "Pushing to GitHub..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git diff --quiet && git diff --cached --quiet; then
  warn "No uncommitted changes — pushing existing commits"
fi
git push origin "$CURRENT_BRANCH" || err "GitHub push failed"
ok "GitHub — https://github.com/50yas/PawPrintFind"

# ── 3. Firebase Firestore Rules ───────────────────────────────────────────────
log "Deploying Firestore rules..."
firebase deploy --only firestore:rules,storage || err "Firestore/Storage rules deploy failed"
ok "Firestore + Storage rules deployed"

# ── 4. Firebase Cloud Functions ───────────────────────────────────────────────
if [ "$DEPLOY_FUNCTIONS" = true ]; then
  log "Deploying Cloud Functions..."
  firebase deploy --only functions || err "Functions deploy failed"
  ok "Cloud Functions deployed"
else
  warn "Skipping Cloud Functions (--no-functions flag)"
fi

# ── 5. Firebase Hosting ───────────────────────────────────────────────────────
log "Deploying to Firebase Hosting..."
firebase deploy --only hosting || err "Firebase Hosting deploy failed"
ok "Firebase Hosting — https://pawprint-50.web.app"

# ── 6. Google App Engine (optional) ──────────────────────────────────────────
if [ "$DEPLOY_GCLOUD" = true ]; then
  log "Deploying to Google App Engine..."
  gcloud app deploy --quiet || err "App Engine deploy failed"
  ok "Google App Engine deployed"
else
  warn "Skipping App Engine (use --gcloud flag to include it)"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment complete!                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Live app:${NC}  https://pawprint-50.web.app"
echo -e "  ${CYAN}GitHub:${NC}    https://github.com/50yas/PawPrintFind"
echo -e "  ${CYAN}Console:${NC}   https://console.firebase.google.com/project/pawprint-50"
echo ""
