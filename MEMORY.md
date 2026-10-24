# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-24 run 2: added pause (P/Esc), heart pickups (3% drop, bosses always), kill particles, hurt shake, Garlic Aura weapon; buffed bolt cooldown 0.9->0.65 and move speed 150. Smoke test now includes a kiting bot (balance probe) + pause check: idle ~41s, bot ~188s. Remote still has no `main`; PR needs a base branch.
## Next steps
- Make bot collect gems / improve balance toward 5 min, treasure chests, more weapons, sound. See ROADMAP "Next".
