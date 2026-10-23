# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc, state 'pause'), hit particles + player-hurt screen shake, heart pickups (2.5% drop, bosses always), Garlic Aura weapon. Smoke passes (idle player still dies ~32s; balance untouched).
## Next steps
- Balance pass (needs real playtest), sound, treasure chests, whip/boomerang weapons, evolutions. See ROADMAP "Next".
