# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), Garlic Aura weapon, heal pickups (3% drop), kill particles + screen shake, smoke test now has a kiting bot (balance probe, exposes `__tzs.keys`). Balance: bolt cd 0.9->0.6, spawn ramp 0.9+t/35+(t/140)^2, start hp 120, first level at 4xp, hurt iframes 0.8s. Bot (always picks choice 1) now survives ~150s; idle player 60s+. Still no `main` branch on origin, so no PR/merge possible; work is on `ccr-079477ac-bi84aq`.
## Next steps
- Playtest toward 5+ min survival (bot still dies ~2.5 min), then boomerang/whip weapons + evolutions, chests, sound, sprites, spatial hash. See ROADMAP "Next".
