#!/usr/bin/env bash
# Copy this repository's working tree into a new directory (no .git, no node_modules, no dist).
# Usage: ./scripts/new-project-from-this-repo.sh /path/to/NewProjectDir
set -euo pipefail

DEST="${1:-}"
if [[ -z "$DEST" ]]; then
  echo "Usage: $0 /absolute/or/relative/path/to/NewProjectDir" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_ABS="$(cd "$(dirname "$DEST")" 2>/dev/null && pwd)/$(basename "$DEST")"

if [[ -e "$DEST_ABS" ]]; then
  echo "Error: destination already exists: $DEST_ABS" >&2
  exit 1
fi

mkdir -p "$DEST_ABS"

echo "Copying from $ROOT -> $DEST_ABS"

rsync -a \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude ".cursor" \
  "$ROOT/" "$DEST_ABS/"

echo "Done. Next:"
echo "  cd \"$DEST_ABS\""
echo "  npm ci"
echo "  npm run verify"
echo "See docs/agents/fork-into-new-repo.md for git init and GitHub remotes."
