# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), heart pickups (1.2% drop, boss guaranteed), hit particles, hurt screen shake, `tests/balance.js` kiting bot. Tuned: start magnet 80, first level at 4 xp, bolt cd 0.7s. Bot lasts 2-5 min. Test hook now exposes `keys`.
- Repo still has NO `main` branch (only per-run ccr-* branches), so PR+merge is impossible. User should create `main` (e.g. from the newest ccr branch) so runs can PR into it.
## Next steps
- More weapons (whip/arc, boomerang, garlic aura) + evolutions; treasure chests; sound; spatial hash; sprites.
