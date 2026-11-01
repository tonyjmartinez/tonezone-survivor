# Agent instructions
This repo is iterated on by an hourly scheduled Claude run. Every run:
0. FIRST command: `git fetch origin main && git reset --hard origin/main` (session branches start stale and have repeatedly re-built features already on main).
1. Read `MEMORY.md` and `ROADMAP.md` first.
2. Pick the next unchecked roadmap item(s); keep changes small and playable.
3. Run `node --check src/game.js` and the smoke test in `tests/smoke.js`.
4. Update `MEMORY.md` (append a dated log entry, update "Next steps") and tick `ROADMAP.md`.
5. Commit and push to the designated session branch; try to merge to `main` (via PR + merge) when green.
Keep it dependency-free (vanilla JS canvas) unless there's a strong reason.

## Shared web and mobile game
- `index.html` and `src/**` are the canonical game for BOTH web and Flutter. Put mechanics, art, balance, menus and touch controls here once. Do not fork them under `mobile/`.
- `mobile/assets/game/` is ignored generated output. `npm run mobile:prepare` copies the canonical game and writes a SHA-256 manifest. Do not edit or commit those copies.
- After changing shared gameplay, run the existing smoke plus `npm run test:packaging`, `npm run mobile:prepare`, and `node tests/mobile-smoke.js` with the same Playwright/CHROMIUM environment. The latter runs one touch/farming/menu flow against both the web entry and mobile bundle. These checks need Node/browser only, not Flutter.
- `npm run mobile:android`, `mobile:bundle`, `mobile:run`, `mobile:test` and `mobile:integration` refresh the shared bundle before invoking Flutter. Use a Windows/Android build worker for native validation; a Mac/Xcode worker is still required for iOS validation.
- Flutter owns native lifecycle, safe areas, navigation and platform integration. Coordinate native changes with `codex-flutter` through factory chat; keep game decisions with the existing game owners. See `docs/SHARED-DEVELOPMENT.md`.
