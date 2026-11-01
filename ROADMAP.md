# Roadmap
## MVP (done in run 1)
- [x] Player movement (keys + touch drag), camera follow
- [x] Auto-fire weapons: Magic Bolt, Orbiting Orbs, Pulse Nova
- [x] Enemies spawn offscreen, chase player; 4 types unlocked over time + boss every 2 min
- [x] Difficulty ramp: spawn rate, HP and speed scale with time
- [x] XP gems, level-ups with 3 random choices (weapons + 5 passives)
- [x] HUD, death screen, best-time via localStorage
- [x] Headless smoke test
## Next
- [x] Balance pass v1 (idle ~50s, kiting bot ~2min; needs real playtest for 5+ min)
- [x] Health pickups, screen shake / hit particles
- [x] Treasure chests (boss drop)
- [x] Garlic aura
- [x] Boomerang
- [x] Whip (arc)
- [x] Weapon evolutions (maxed weapon + paired passive via chest)
- [x] Sound (WebAudio bleeps, M = mute)
- [x] Pause key (P/Esc)
- [x] Themed floor tiles (checker + stones/grass, run 9)
- [x] More enemy variety (wisp swarm, golem; run 11)
- [x] Procedural enemy sprites (wings/horns/eyes tracking player; run 14). Player + heart sprites done run 15; gems/chests still simple
- [x] Spatial hash for enemy separation (run 13; enemy cap 400->800)
- [x] Meta upgrades with gold (run 10)
- [x] Character select (run 12)
- [x] Gem + chest sprites, gem merging (run 17)
- [x] Projectile sprites: bolt + boomerang (run 18)
- [x] Recovery (regen) passive (run 19)
- [x] Horde ring events every 75s (run 20)
- [x] Lightning weapon (run 21)
- [x] Vacuum pickup (run 22)
- [x] Armor passive (run 23)
- [x] Bomb pickup (run 25)
- [x] Luck passive (run 26)
- [x] Growth (XP) passive (run 27)
- [x] Freeze pickup (run 28)
- [x] Boss HP bar (run 31)
- [x] Win condition: survive 10:00 for 'YOU SURVIVED' + 200 bonus gold (run 32)
- [x] Hard mode toggle on title (H): +40% spawns, +50% gold (run 35)
- [x] 'NEW BEST!' marker on end screen (run 37)
- [x] Dash ability with cooldown + i-frames (run 40)
- [x] Bloat enemy that splits on death (run 41)
- [x] End-screen build summary: weapons + passives (pd loop)
- [x] Dasher enemy that lunges periodically (pd loop)
- [x] Mines weapon (pd loop)
- [x] Troll enemy that regenerates unless hit (pd loop)
- [x] Frost Shards weapon: ring of slowing shards; evolves with Armor (pd loop)

## Milestone: varied, replayable 10-minute runs
Goal: two runs should not feel the same. Each item is one loop iteration, ordered by user value. Follow docs/ART.md (12-colour palette, readability rule, 8x8/16x16 grids, smoke EXPECT table) and the MEMORY.md conventions (smoke test covers each feature; sync to origin/main first).
- [x] (product) Level-up reroll: one free reroll per run (key R / button on the card screen), +1 per Luck level. Why: choices are only 3 random cards (`choiceRects`), so a bad draw can wreck a run.
- [x] (product) Timed map events beyond hordes: add a "swarm lane" event (a stream of fast enemies crossing the screen, telegraphed by a banner) alternating with `spawnHorde` every `HORDE_EVERY`. Why: the only scripted event is the 75s ring, so minutes 3-9 feel alike.
- [x] (product) Elite enemies: from 3:00 a small chance a normal enemy spawns as an elite (2.5x HP, larger, tinted, guaranteed heart or chest chance). Why: enemy types unlock on a fixed schedule (`ENEMY_TYPES.from`) and bosses are the only standouts.
- [x] (product) Two more characters: Pyro (Mines start, -10% speed) and Stormcaller (Lightning start, +1 area). Why: `CHARS` has 4 entries and only they define starting weapon variety; cheap to add and gives replay choice.
- [ ] (design) Pixel portraits for the character-select screen (16x16 player variants per class, drawn at 3x with the class colour). Why: select screen is text with a tint; ART.md slice 7 left menus without sprites.
- [ ] (design) Elite and swarm-lane readability: distinct elite silhouette marker (crown pixel/ember outline) and banner art that obeys the readability rule at 390px. Why: new threats must be distinguishable by silhouette per ART.md.
- [x] (product) End-screen run stats: kills, level, gold earned, and a one-line "best build" memory in localStorage. Why: the end screen shows a build summary but nothing to beat besides time (`tzs_best`).
- [x] (design) ART.md slice 8: crowded-scene perf check (300+ enemies, 390px) with screenshots, plus visual check of pause/end screens (known leftover in MEMORY.md).

## Milestone: Feels great to play
Vision: a stranger plays on a phone for ten minutes and wants to replay. Game feel over features. Each item is one small PR with a smoke assertion and a 390px screenshot in the PR body. Already present: enemy hit flash, floating damage numbers, small shake on horde/bomb (check before adding).
- [x] (feel) Hit feedback pass 1: default knockback away from the player (non-bosses), kill-pop particles, shake scaled to damage taken.
- [ ] (feel) Hit feedback pass 2: tiny hit-stop on kills, and damage numbers coloured/larger for crits and elites.
- [ ] (feel) Level-up moment: short freeze + screen flash + chime, cards slide in, XP bar pulse before the screen opens.
- [ ] (feel) Difficulty curve: a clear spike near 5:00 (denser spawns plus a new enemy type), a relief window after, and a boss climax near 10:00 (bigger final boss with telegraphed attacks) before the win.
- [ ] (feel) Meaningful build choice: every run offers a decision (weapon evolutions or branching passives; first level-up offers 3 distinct weapons), shown on the end screen as the build summary.
- [ ] (feel) Phone ergonomics: touch joystick dead-zone and size, dash button target >= 48px, nothing important under thumbs.
- [ ] (feel) Death and restart: quick restart (one tap), run stats, "best build" memory so a replay feels motivated.

### Blocked on Tony
- Real 5+ minute human playtest for balance numbers (needs a person playing on a phone/desktop; bot results only approximate).
- Any music/audio assets or licensed art: need files and licence confirmation from Tony.
- Public hosting/analytics or leaderboard: needs a decision and credentials.
