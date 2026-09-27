#!/usr/bin/env bash
# Publishes the current tracked files of this repo into the `typing-game/`
# subfolder of https://github.com/rcarin/Games.git, preserving the rest of
# that repo untouched.
#
# Why not a plain `git push`? This repo's root corresponds to a *subfolder*
# of Games, not its root. A raw push from here would try to make Games'
# root match this repo's root, deleting README.md and any sibling games.
# Instead we clone Games fresh, replace just typing-game/ with our tracked
# files (so deletions are handled correctly too), and commit+push only that.

set -euo pipefail

REPO_URL="https://github.com/rcarin/Games.git"
SUBDIR="typing-game"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

cd "$PROJECT_ROOT"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: run this from within the typing-game git repo." >&2
  exit 1
fi

echo "Cloning $REPO_URL..."
git clone --depth 1 "$REPO_URL" "$WORK_DIR/games" --quiet

echo "Syncing tracked files into $SUBDIR/..."
rm -rf "${WORK_DIR:?}/games/$SUBDIR"
mkdir -p "$WORK_DIR/games/$SUBDIR"

git ls-files | while IFS= read -r f; do
  mkdir -p "$WORK_DIR/games/$SUBDIR/$(dirname "$f")"
  cp "$f" "$WORK_DIR/games/$SUBDIR/$f"
done

cd "$WORK_DIR/games"
git add "$SUBDIR"

if git diff --cached --quiet; then
  echo "No changes to publish — $SUBDIR/ is already up to date."
  exit 0
fi

MESSAGE="${1:-Update typing-game}"
git -c user.email="rcarindam@gmail.com" -c user.name="rcarin" commit -m "$MESSAGE" --quiet
git push origin main

echo "Published to $REPO_URL ($SUBDIR/)"
