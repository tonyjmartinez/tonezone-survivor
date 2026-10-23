# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc/tap), heart pickups (2.5% drop, bosses always; +25hp), hit/death particles, screen shake on damage, Garlic Aura weapon. Smoke test extended (pause + aura). Balance pass still TODO (needs real playtest; idle bot dies ~32s).
## Next steps
- Balance pass (bot that moves), treasure chests, more weapons (whip/boomerang), WebAudio sound. See ROADMAP "Next".
