# Ink & Ivory — Typewriter Typing Test

An antique typewriter / coffee-themed typing speed test built with Vite.

## Features
- Solo or two-player (turn-based) modes with named players and avatars
- Time, Words, Quote, and Daily Challenge passages
- Live WPM, accuracy, error, and combo-streak tracking
- Two-player duels race against a live "ghost" of the first player's pace
- Post-game stats: rank titles, vs-last-time and vs-average comparisons, and a performance graph
- Collectible merit stamps and a local Hall of Fame leaderboard (saved in the browser via localStorage)

## Running locally

    npm install
    npm run dev

Then open the printed local URL (usually http://localhost:5173).

## Build

    npm run build
    npm run preview

## Publishing to the Games collection

This project also lives at https://github.com/rcarin/Games in the `typing-game/` folder.
Every local `git commit` here auto-publishes to that repo via a `post-commit` hook
(see `scripts/sync-to-games.sh`). To sync without committing, run `npm run sync:games`.
