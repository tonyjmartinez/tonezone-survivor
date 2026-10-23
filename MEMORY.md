# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added Garlic Aura weapon, pause (P/Esc), heart pickups (1.5% drop, bosses always), hit particles, screen shake on damage, faster XP curve (need 3, x1.22+2). Added `tests/bot.js` (kiting bot, balance probe: dies ~150-200s). Smoke test passes.
## Next steps
- Treasure chests, weapon evolutions, more weapons (boomerang/whip), WebAudio sound, spatial hash. Bot is naive; tune difficulty so a smart player can reach ~10min. See ROADMAP "Next".
