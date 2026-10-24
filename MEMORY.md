# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), heart pickups (2.5% drop, bosses always), hit/death particles, screen shake on damage, `tests/balance.js` (kiting bot; `__tzs.setMove` hook). Softened ramp: spawnRate 1.2+t/30+(t/150)^2, hp x(1+t/120), level need x1.3. Bot survival went ~140-207s -> ~163-226s. Branch `ccr-079477ac-27pfaf` (no `main` yet at start of run).
## Next steps
- More weapons (whip/boomerang/garlic) + evolutions, chests, sound, spatial hash. See ROADMAP "Next".
