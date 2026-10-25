# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-25 run 2: added pause (P/Esc), heart pickups (1.5% drop, boss guaranteed), hit/death particles, screen shake on damage, bolt cooldown 0.9->0.75. Added `tests/balance.js` (kiting bot; survives ~130-170s, idle player ~30-55s). Remote has no `main`; work on `ccr-079477ac-xodh34`.
## Next steps
- Smarter balance (bot is crude; real players should reach 5+ min), more weapons (whip, boomerang, garlic aura), evolutions, sound, spatial hash.
