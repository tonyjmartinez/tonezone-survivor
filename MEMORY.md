# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc), heart pickups (2.5% drop, boss guaranteed, +25hp), hit/death particles, screen shake on damage. Smoke test checks pause toggle. Branch `ccr-079477ac-1gym0h`; still no `main` on remote.
## Next steps
- Balance pass, more weapons (whip, garlic), chests, sound. See ROADMAP "Next".
