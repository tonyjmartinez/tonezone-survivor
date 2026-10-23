# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc/tap), health hearts (1.5% drop, bosses always), kill/hurt particles, screen shake on hit. Faster early leveling (need 4, x1.28+2; bats give 2xp; magnet 80). Added `tests/balance.js` (kiting bot via `__tzs.steer`); avg bot survival 145s -> ~214s. Idle player still dies ~32s.
## Tools
- `node tests/smoke.js` (pass/fail), `node tests/balance.js [runs]` (prints bot survival times).
## Next steps
- More weapons (whip/arc, boomerang, garlic aura), treasure chests, sound, spatial hash. Bot dies ~200s; target 5+ min once more weapons exist. See ROADMAP "Next".
