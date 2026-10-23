# Living memory
## Architecture
- `index.html` -> `src/game.js` (single IIFE; states: title/play/levelup/dead; `window.__tzs` test hook).
- World is infinite (camera follows player); enemies spawn on a ring just outside the screen.
- Difficulty: `spawnRate()` = 1.2 + t/25 + (t/120)^2 per sec; enemy hp x(1+t/90); speed up to +60%.
## Log
- 2026-10-22 run 1: repo was empty. Built full MVP (see ROADMAP). Smoke test passes. Repo had no `main` branch yet; work lives on `ccr-079477ac-9ewkoc`.
- 2026-10-22 run 2: gentler spawn ramp (0.8+t/30+(t/130)^2), 120 starting HP; heart pickups (2.5% drop, bosses always); hit particles + screen shake; pause (P/Esc). Idle player now dies ~50s; dumb kiting bot ~2min. Smoke passes. `main` still absent -> PR/merge attempted.
- 2026-10-23 run 3: found main already had run 2's work (parallel branch had duplicated it; reset to main). Added Garlic Aura weapon (aura dmg tick + 40% slow), `tests/bot.js` kiting-bot balance probe (~135-165s), `keys` exposed on test hook.
- 2026-10-23 run 4: added Boomerang weapon (outbound 0.7s then homes back, pierces, per-enemy 0.35s hit cooldown). Smoke passes.
- 2026-10-23 run 5: WebAudio bleeps (hit/kill/heart/levelup/death), M toggles mute; silently disabled if AudioContext fails (headless safe).
## Next steps
- Check `origin/main` before starting (parallel session branches exist). More weapons (whip/boomerang) + evolutions, chests, sound, spatial hash. See ROADMAP "Next".
