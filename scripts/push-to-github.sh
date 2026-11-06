#!/usr/bin/env bash
set -e

# FilterTap GitHub Remote & Push Helper
# Usage: ./scripts/push-to-github.sh <github-repo-url>

REPO_URL="$1"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./scripts/push-to-github.sh <github-repo-url>"
  echo "Example: ./scripts/push-to-github.sh https://github.com/username/filtertap-app.git"
  exit 1
fi

echo "Configuring GitHub remote origin..."
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "Remote set to $REPO_URL"
echo "Pushing main branch to GitHub..."
git push -u origin main

echo "Successfully pushed to GitHub! The APK build does NOT start on push. Run it manually from the 'Actions' tab (Build and Release Android APK -> Run workflow)."
