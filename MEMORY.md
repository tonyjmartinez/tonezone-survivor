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
- 2026-10-23 run 6: Whip weapon (arc slash at nearest foe within 220px, dmg 14+5*lvl, wider/longer per level). Branch was re-synced to main (PR #4, a duplicate of run 2, closed).
- 2026-10-23 run 7: treasure chests (bosses drop one; pickup = +1 level to a random owned non-maxed weapon, else full heal). Direct-pickup only (no magnet).
- 2026-10-23 run 8: weapon evolutions. Maxed (Lv6) weapon + paired passive (see `EVOLVE` map in game.js) -> boss chest evolves it to Lv8 ("EVO" in HUD, shake + text). Verified via test-hook script; smoke passes.
- 2026-10-23 run 9: themed floor (checker tiles + hashed stone/grass decorations, no assets). Duplicate PR #8 (re-did run 2 work) closed; branch reset to main again.
- 2026-10-23 run 10: gold + meta upgrades. Death awards gold (kills + t/10) into localStorage `tzs_gold`; title screen keys 1-3 buy Toughness/Power/Fleetfoot (`tzs_meta`, `META` in game.js), applied in `newGame()`. Smoke test covers a purchase; `__tzs.state` now settable.
- 2026-10-23 run 11 (second branch session): reset to main; added Wisp (swarm of 5, from 2:00) and Golem (tanky, from 4:00) enemy types. Smoke + bot pass.
- 2026-10-23 run 12: character select (title: left/right or A/D; saved in `tzs_char`): Mage/Knight/Druid/Rogue with different start weapon + stat tweaks (`CHARS` in game.js). Smoke covers it. Run-12 first attempt duplicated main again (PR #12 closed) - ALWAYS fetch origin/main first.
- 2026-10-23 run 13: fetched origin/main first. Replaced O(n) neighbor-window separation with a per-frame spatial hash (CELL=48) in the enemy loop; enemy cap raised to 800. Smoke + bot (130-169s) unchanged. Hash is not yet used by weapon hit tests (still linear).
- 2026-10-23 run 14: fetched origin/main first (my local branch was stale again; discarded duplicate run-2 work). Added `drawEnemy()` procedural sprites per enemy `kind` (bat wings, horned imp/brute, blocky golem, wisp tail, eyes track player). Smoke + bot (120-184s) pass.
- 2026-10-23 run 15: fetched origin/main first (my fresh run-2 duplicate discarded again; branch reset to main). Added `drawPlayer()` (shadow, cape, crown, facing eye) and bobbing `drawHeart()`. Smoke + bot (138-151s) pass.
- 2026-10-23 run 16: fetched origin/main first (my stale branch again held duplicate work; reset to main). Faster early leveling (need 3, then x1.22+2). Bot 131-189s (was 120-184s), smoke passes.
- 2026-10-23 run 17: fetched origin/main first. Gem diamond sprites (`drawGem`), bobbing chest sprite (`drawChest`), and far small-gem merging when >300 gems. Smoke + bot (140-168s) pass.
- 2026-10-23 run 18: fetched origin/main first (stale branch again, reset). Added `drawBolt` (rotated glowing bolt w/ trail) and spinning `drawBoom` sprites.
- 2026-10-23 run 19: fetched origin/main first (branch was stale again; my duplicate run-2 work discarded). Added Recovery passive (+0.5 HP/s per level, `p.regen`).
- 2026-10-23 run 20: fetched origin/main first (discarded my duplicate run-2 work again). Added horde events: every 75s a ring of 20-40 enemies spawns around the player with a banner (`spawnHorde`, `HORDE_EVERY`). Bot 135-149s (was ~160), smoke passes.
- 2026-10-23 run 21: fetched origin/main first (my stale branch again held duplicate run-2 work; reset). Added Lightning weapon (`zap`: strikes N random on-screen enemies, evolves with Recovery).
- 2026-10-23 run 22: fetched origin/main first (my checkout was stale; duplicate run-2 work discarded again). Added Vacuum pickup (0.6% drop, pulls all gems; `G.vacs`).
- 2026-10-23 run 23: fetched origin/main first (branch was stale again; duplicate run-2 work discarded). Added Armor passive (-1 dmg per hit, min 1; `p.armor`).
- 2026-10-24 run 24: fetched origin/main first; my session branch was stale again and my pause/aura/hearts/particles work was a full duplicate of main, so discarded it. No gameplay change; smoke passes on main. Tip: scheduled sessions start from an old branch - ALWAYS `git fetch origin main && git reset --hard origin/main` before coding.
- 2026-10-24 run 25: fetched origin/main first (stale branch, reset). Added Bomb pickup (0.4% drop, `G.bombs`; kills on-screen foes, 120 dmg to bosses). Smoke + bot (117-309s) pass.
## Next steps
- Check `origin/main` before starting (parallel session branches exist). use hash for weapon queries (low value), more weapons/enemy variety, sprite polish for projectiles, real playtest balance (5+ min). See ROADMAP "Next".
