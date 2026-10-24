# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), Garlic Aura weapon, heart pickups (2.5% drop, bosses always), hit/kill particles, screen shake on damage, `tests/bot.js` kiting-bot balance probe (random upgrades die ~100-130s, around first boss). Smoke passes. Branch `ccr-079477ac-17tau8`.
## Next steps
- Balance: bot dies near the 2:00 boss; consider easing ramp slightly or smarter bot. Then sound, more weapons (boomerang/whip), evolutions, treasure chests, sprites, spatial hash.
