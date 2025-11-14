#!/bin/bash

# This script controls when Vercel should build
# Exit code 0 = Skip build
# Exit code 1 = Proceed with build

echo "🔍 Checking if build should proceed..."

# Check if this is triggered by GitHub Actions (via Vercel CLI)
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]] || [[ "$VERCEL_GIT_COMMIT_REF" == "dev" ]]; then
  # For main/dev branches, only build if triggered by GitHub Actions
  if [[ -z "$GITHUB_ACTIONS" ]]; then
    echo "⏭️  Skipping build - waiting for GitHub Actions to complete first"
    echo "ℹ️  Builds for main/dev are triggered by GitHub Actions after successful CI"
    exit 0
  else
    echo "✅ Build triggered by GitHub Actions - proceeding"
    exit 1
  fi
fi

# For other branches (PRs, feature branches), allow automatic builds
echo "✅ Building branch: $VERCEL_GIT_COMMIT_REF"
exit 1

