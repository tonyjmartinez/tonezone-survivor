# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), heart pickups (2.5% drop, boss always), hit/death particles, screen shake on damage, faster leveling, stronger bolt, softer difficulty curve (quad term t/150, hp x(1+t/110)). Added `tests/balance.js` (kiting bot, `node tests/balance.js N`; avg survival 148s -> 170s). `__tzs.setMove(x,y)` overrides movement for bots. Note: session branch was `ccr-079477ac-4kc72g` this run (previous: `-9ewkoc`); still no `main` on origin.
## Next steps
- More weapons (whip, boomerang, garlic aura) + evolutions, sound, chests. Bot dies ~170s: could tune further. See ROADMAP "Next".
