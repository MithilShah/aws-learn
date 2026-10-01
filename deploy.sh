#!/usr/bin/env bash
#
# deploy.sh — build the AWS learning-journeys site and publish it to
# studytrails.com/aws/ (Bluehost), next to the WordPress site.
#
# The site is an Astro static site (site/). This script runs the test suite,
# builds the site (which also runs Pagefind indexing via `npm run postbuild`),
# verifies the built output, then rsyncs site/dist/ to the server. Journey
# content lives in journeys/<service>/*.mdx and is read in place by Astro's
# content collection — you edit those files, not anything under site/dist.
#
# Safety:
#   - rsync uses --delete, so it mirrors dist/ onto REMOTE_PATH. To make sure a
#     misconfigured path can never wipe the WordPress site at public_html/,
#     this script REFUSES to run unless REMOTE_PATH ends in "/aws".
#   - Unit tests, the type check and the dist/SEO checks all run before any
#     upload. A failure aborts before touching the server.
#
# One-time setup:
#   1. cp deploy.config.example deploy.config   then edit it.
#   2. cd site && npm install
#
# Usage:
#   ./deploy.sh            # test + build + verify + upload
#   ./deploy.sh --dry-run  # test + build + verify, then show what WOULD upload
#   ./deploy.sh --build    # only test + build + verify locally, don't upload
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

# ---- Load config (not needed for --build) ----------------------------------
if [[ "$BUILD_ONLY" == "0" ]]; then
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

  # Safety guard: never let rsync --delete point anywhere but an /aws folder.
  # Strip a single trailing slash first so ".../aws" and ".../aws/" both pass.
  if [[ "${REMOTE_PATH%/}" != *"/aws" ]]; then
    echo "ERROR: refusing to deploy — REMOTE_PATH must end in \"/aws\"."
    echo "       Got: ${REMOTE_PATH}"
    echo "       This guard stops rsync --delete from ever wiping the"
    echo "       WordPress site at public_html/."
    exit 1
  fi
fi

# ---- Pre-flight checks (abort before any upload) ---------------------------
if [[ ! -d site/node_modules ]]; then
  echo "==> site/node_modules missing — running npm install ..."
  ( cd site && npm install )
fi

echo "==> Running unit tests ..."
( cd site && npm test )

echo "==> Type-checking (astro check) ..."
( cd site && npm run check )

# ---- Build the Astro site --------------------------------------------------
echo "==> Building Astro site (site/) ..."
# `npm run build` runs `astro build` then `postbuild` (pagefind --site dist).
( cd site && npm run build )

DIST="site/dist"
if [[ ! -f "$DIST/index.html" ]]; then
  echo "ERROR: build did not produce $DIST/index.html"; exit 1
fi
if [[ ! -f "$DIST/404.html" ]]; then
  echo "ERROR: build did not produce $DIST/404.html"; exit 1
fi

# Safety: fail if any symlinks slipped into dist (they'd upload broken).
if find "$DIST" -type l | grep -q .; then
  echo "ERROR: symlinks found in $DIST — aborting:"; find "$DIST" -type l
  exit 1
fi

echo "==> Verifying built output (dist/SEO checks) ..."
( cd site && npm run test:dist )

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
