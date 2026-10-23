# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc/tap), heart pickups (2% drop, bosses always), kill particles, hurt screen shake, bolt cooldown 0.9->0.75s. Added `tests/balance.js` (kiting bot; survives ~2-2.5 min, dies near first boss). `__tzs.keys` exposed for bots. Remote has no `main`; work on `ccr-079477ac-wb7f06`.
## Next steps
- More weapons (whip/boomerang/garlic) + evolutions, treasure chests, WebAudio sound, sprites, spatial hash. See ROADMAP "Next".
