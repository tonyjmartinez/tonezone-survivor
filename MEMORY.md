# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc/tap), heart pickups (4% drop, boss always; heal 25% max HP), kill particles, hurt/boss screen shake, gentler difficulty ramp (spawn 1.0+t/32+(t/150)^2, hp x(1+t/110)). Added `tests/balance.js` (idle + naive kiting bots; kite bot median ~137s, idle ~38s; real players should do better). Exposed `keys` on `__tzs`. States now: title/play/levelup/paused/dead.
## Next steps
- More weapons (whip/arc, boomerang, garlic aura) + evolutions; chests; sound; spatial hash; sprites. See ROADMAP "Next".
