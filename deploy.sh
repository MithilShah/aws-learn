#!/usr/bin/env bash
#
# deploy.sh — build the Astro site and publish it to studytrails.com (Bluehost)
#
# The book is now an Astro static site (site/). This script builds it (which
# also runs Pagefind indexing via `npm run postbuild`) and rsyncs the produced
# site/dist/ to the server. Chapter markdown still lives in agentic-ai-book/
# and is read in place by Astro's content collection — you edit those files,
# not anything under site/.
#
# The previous Docsify deploy is preserved as deploy-docsify.sh.bak.
#
# One-time setup:
#   1. cp deploy.config.example deploy.config   (already done)
#   2. cd site && npm install
#
# Usage:
#   ./deploy.sh            # build + upload
#   ./deploy.sh --dry-run  # build, then show what WOULD upload (no changes)
#   ./deploy.sh --build    # only build site/dist locally, don't upload
#
set -euo pipefail
cd "$(dirname "$0")"

DRY_RUN=0
BUILD_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --build)   BUILD_ONLY=1 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# ---- Load config -----------------------------------------------------------
if [[ ! -f deploy.config ]]; then
  echo "ERROR: deploy.config not found."
  echo "Run: cp deploy.config.example deploy.config  then edit it."
  exit 1
fi
# shellcheck disable=SC1091
source deploy.config

: "${SSH_HOST:?Set SSH_HOST in deploy.config}"
: "${SSH_USER:?Set SSH_USER in deploy.config}"
: "${SSH_PORT:=22}"
: "${REMOTE_PATH:?Set REMOTE_PATH in deploy.config}"

# ---- Build the Astro site --------------------------------------------------
echo "==> Building Astro site (site/) ..."
if [[ ! -d site/node_modules ]]; then
  echo "    site/node_modules missing — running npm install ..."
  ( cd site && npm install )
fi
# `npm run build` runs `astro build` then `postbuild` (pagefind --site dist).
( cd site && npm run build )

DIST="site/dist"
if [[ ! -f "$DIST/index.html" ]]; then
  echo "ERROR: build did not produce $DIST/index.html"; exit 1
fi

# Safety: fail if any symlinks slipped into dist (they'd upload broken).
if find "$DIST" -type l | grep -q .; then
  echo "ERROR: symlinks found in $DIST — aborting:"; find "$DIST" -type l
  exit 1
fi

TOTAL=$(du -sh "$DIST" | cut -f1)
echo "    Built $TOTAL across $(find "$DIST" -type f | wc -l | tr -d ' ') files."

if [[ "$BUILD_ONLY" == "1" ]]; then
  echo "==> --build only: output ready at ./$DIST/ (no upload)."
  exit 0
fi

# ---- Upload via rsync-over-ssh ---------------------------------------------
SSH_CMD="ssh -p ${SSH_PORT}"
[[ -n "${SSH_KEY:-}" ]] && SSH_CMD="$SSH_CMD -i ${SSH_KEY}"
RSYNC_OPTS=(-az --delete --omit-dir-times --no-perms
            --exclude '.DS_Store'
            -e "$SSH_CMD")
if [[ "$DRY_RUN" == "1" ]]; then
  RSYNC_OPTS+=(--dry-run -v)
  echo "==> DRY RUN — no files will change on the server."
fi

echo "==> Syncing ./$DIST/ -> ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}"
rsync "${RSYNC_OPTS[@]}" "$DIST"/ "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

if [[ "$DRY_RUN" == "0" ]]; then
  echo "==> Done. Live at: ${PUBLIC_URL:-(set PUBLIC_URL in deploy.config)}"
  echo "    Reminder: submit the sitemap in Google Search Console —"
  echo "      ${PUBLIC_URL%/}/sitemap-index.xml"
fi
