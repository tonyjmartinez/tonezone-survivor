# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), heart drops (4%, bosses always, +20hp), hit particles, hurt screen shake. Smoke test now has a kiting bot (flees enemy centroid via synthetic keys, 3 min cap): idle dies ~32s, bot dies ~127s at lvl 3 (bot barely levels since it never fights; real players should do better). Not yet merged to main: no `main` branch exists on remote; see PR.
## Next steps
- More weapons (whip/garlic/boomerang), treasure chests, sound, spatial hash. A smarter bot (that also collects gems) would give better balance data.
