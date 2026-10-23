# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-23 run 2: added pause (P/Esc/tap), heart pickups (3% drop, bosses always, +25hp), hit/kill particles, screen shake. Light balance pass: spawn 1.0+t/35+(t/150)^2, enemy hp scale t/120, bolt cd 0.7s, contact dmg x0.75, magnet 90. Smoke test now also runs a dumb circle-kiting bot (~70-90s survival; it never aims/collects deliberately, so real players should do better). Still no `main` branch; work stays on session branch.
## Next steps
- More weapons (whip/boomerang/garlic) + evolutions, sound, chests, spatial hash. See ROADMAP "Next".
