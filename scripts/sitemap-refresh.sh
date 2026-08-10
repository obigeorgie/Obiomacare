#!/usr/bin/env bash
# sitemap-refresh.sh — Weekly sitemap lastmod refresh for Google indexing
# Runs via cron, commits, pushes to trigger deploy

set -e

REPO="/root/.openclaw/workspace/obioma-care"
TODAY=$(date +%Y-%m-%d)

cd "$REPO"

# 1. Update all lastmod dates to today
sed -i "s/<lastmod>[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}<\/lastmod>/<lastmod>${TODAY}<\/lastmod>/g" landing/sitemap.xml

# 2. Only proceed if there are actual changes
if git diff --quiet landing/sitemap.xml; then
    echo "[$(date)] No sitemap changes needed. Exiting."
    exit 0
fi

# 3. Rebuild public/ so sitemap is included in the build
node scripts/build.js

# 4. Commit and push
git add -A
git commit -m "chore: refresh sitemap lastmod → ${TODAY}" || true
git push origin master

echo "[$(date)] Sitemap refreshed and pushed for ${TODAY}"
