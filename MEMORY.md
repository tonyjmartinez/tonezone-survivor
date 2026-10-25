# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-25 run 2: added pause (P/Esc), death particles, hit screen shake, heart pickups (3% drop, boss always, +25hp), balance pass (gentler early spawn, faster xp curve, hp scaling t/120). Added `tests/bot.js` kiting-bot balance probe (bot survives ~3 min, idle ~55s). Still no `main` branch on remote; PRs target the session branch.
## Next steps
- Bot dies ~3min mostly from late swarm: more weapons (whip, boomerang, garlic aura), weapon evolutions, treasure chests, sound, sprites. See ROADMAP "Next".
