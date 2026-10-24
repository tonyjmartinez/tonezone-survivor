# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: gentler early ramp (spawn 0.8+t/30+(t/130)^2, hp scale t/110); heart pickups (2.5% drop, bosses always); hit particles + screen shake on damage; pause (P/Esc). Stationary idle bot now dies ~46s (was ~30s). Smoke passes.
## Next steps
- More weapons (whip/boomerang/garlic), chests, sound. Real balance needs a moving-bot playtest. See ROADMAP "Next".
