# Tone Zone Survivors: art direction

Goal: read as one game, not a pile of random shapes. Spooky graveyard at night (owner direction 2026-11-01): violet-navy ground, headstones, dead trees and glowing jack-o'-lanterns under faint drifting fog and a moonlit vignette; warm gold and cyan magic. Keep fog faint (enemies must stay readable). No third-party or copyrighted art: every sprite is hand-authored in this repo. No new dependencies.

## Approach: pixel sprites (replaces ad-hoc canvas paths)

- All units, pickups, projectiles, tiles and UI glyphs are **palette-indexed pixel grids** in `src/sprites.js`: one string per row, one character per pixel, `.` = transparent. Keys map to the palette below (`k` Ink, `n` Night, `d` Dusk, `g` Moss dark, `m` Moss, `s` Stone, `w` Bone, `y`/`o` Gold/shade, `c` Cyan, `e` Ember, `r` Blood, `v`/`u`/`l` Violet/shade/light, `b`/`B`/`h` a body slot that variants tint).
- Sizes: 16x16 player and enemies; 24-32 bosses; 8x8 pickups and projectiles. 2-4 frames per animation.
- Baked **once at load** into offscreen canvases: per frame a normal, a mirrored and a hit-flash (Bone) copy. Never re-rasterise per frame.
- The 1px Ink outline is **baked automatically** around every filled pixel (4-neighbour), so grids leave a transparent border pixel and never draw their own outline.
- Light from the top-left: authors place the light step (`h`/`l`) on the upper-left edge and the shade step (`B`/`u`/`o`) on the lower-right. Two shade steps, no more.
- Drawn with `drawSprite()` at an **integer scale** (2x in play) with `imageSmoothingEnabled = false` and rounded positions. Collision radii never change with art.
- Review page: `index.html?sprites=1` renders every sprite, animation and frame (plus flip and hit rows, and a live loop) on a grid for screenshots.
- The smoke test asserts every sprite bakes with the expected size and frame count; add new sprites to its `EXPECT` table.


## Palette (12 colours, hard cap)

| # | Name | Hex | Use |
|---|------|-----|-----|
| 1 | Ink | #0b1020 | outlines, deepest shadow, text backing |
| 2 | Night | #1e2a4a | ground base, plates (at 62% alpha) |
| 3 | Dusk | #2a3a63 | ground highlight, plate rim tint |
| 4 | Moss dark | #23402f | ground detail, tree shade |
| 5 | Moss | #3f7a4a | grass tufts, friendly organics |
| 6 | Stone | #64708a | props, golem, neutral metal |
| 7 | Bone | #e2e8f0 | eyes, highlights, body text |
| 8 | Gold | #fbbf24 | player accent, XP, HUD trim, pickups |
| 9 | Cyan | #38bdf8 | friendly magic: orbs, shards, frost |
| 10 | Ember | #f97316 | hostile warm accent: fire, imps, damage numbers |
| 11 | Blood | #ef4444 | hostile hits, hearts, low health |
| 12 | Violet | #a78bfa | player body and bats (night creatures) |

Enemy body colours are shades of these hues (mix toward Ink for shadow, toward Bone for highlight). Do not add a 13th hue; if a new family needs identity, pick from the existing ones and change the silhouette instead.

## Outline and shading

- Every character, enemy and pickup gets a 1-2 px outline in Ink (or a darker shade of its own hue). Ground props and terrain have no outline; they sit lower in value.
- Two shading steps per form: a base fill, and a shade band on the side away from the light (lower-right). Highlights are a single small Bone dot or arc on the lit side.
- Hit flash replaces the body fill with Bone for 0.1 s; it never changes the silhouette.

## Lighting

- One light source, top-left, from above. Shadows fall to the lower-right and stay soft.
- Ground shadow: a flat Ink ellipse under every ground unit, width about 1.3x radius, 0.3-0.4 alpha. Flying units (bats, wisps) get their shadow offset further down and smaller, so height reads.
- Magic glows are additive-looking blurs made with stacked low-alpha circles, not full-screen filters.

## Silhouette language

Enemies (class = how they move, shape = what they read as):
- Swarm / small (bat, wisp, imp): small, asymmetric, one signature feature (bat wings, wisp tail, imp horns). Fast read at 8-9 px radius.
- Common walkers (ghoul, dasher): rounded body, two eyes facing the player; dasher has a forward spike.
- Heavy (brute, troll, golem): wide and squat; horns on brute and troll; golem is a square block with a stone seam.
- Splitters (bloat, minibloat): round with a pale top spot; they read as "will split".
- Bosses: same family as their base, at least 1.6x radius, with a crown or horn set plus a gold outline.
Animation: 2-4 frame loops driven by G.t (wing flap, leg bob, tail sway). Frame changes must not change hitbox radius.

Player: a round violet body with a gold crown and a cloak tail that sways when walking. Idle = slow bob, walk = faster bob plus tail swing, hit = Bone flash and a short squash.

Weapons and projectiles (shape is the key, colour is the second cue):
- Magic Bolt: small cyan orb with a short trail. Friendly.
- Orbiting Orbs: cyan orbs at fixed radius.
- Pulse Nova: expanding cyan ring (no fill).
- Boomerang: gold crescent that spins.
- Whip: pale arc slash, short-lived.
- Garlic Aura: moss-green dotted ring on the ground.
- Lightning: jagged gold/cyan bolt, one-frame flash.
- Mines: small dark disc with an Ember blink dot.
- Frost Shards: cyan diamond shards; slowed enemies get a cyan tint.
Hostile projectiles and hazards use Ember or Blood, never cyan or gold.

Pickups (distinct by shape first):
- XP gem: small gold diamond. Gold coin: round gold disc with a shine. Heart: Blood heart. Chest: Stone box with a gold band. Bomb and ice pickups: a round Ink orb (bomb, Ember fuse) and a cyan crystal (freeze).

## Readability rule

At a glance, at 390 px wide and at desktop size, the player, enemies, pickups and projectiles must each be distinguishable by silhouette alone, with colour as a second cue:
1. The player is the only violet-and-gold round figure with a cloak tail.
2. Friendly projectiles and magic are cyan or gold; hostile ones are Ember or Blood.
3. Pickups are small and shaped (diamond, disc, heart, box); they never share an enemy's round-body shape.
4. Ground terrain stays in Night, Dusk and Moss values, always darker than any unit it sits under.
5. Any new art that fails this rule is changed before it ships.

## Motion and performance

- Effects are capped and pooled; crowded scenes must not allocate per frame.
- Screen shake and flashes stay short (under 0.3 s) and respect reduced motion where the code already does.
- Cache static art (terrain, shadows, sprite frames) on offscreen canvases at load time.

## Slices (ordered backlog, pixel pipeline)

Earlier canvas-path slices (#55 floor, #58 HUD plates, #59 end panel) stay until their pixel replacements land.

1. Pipeline: `src/sprites.js`, bake + outline + flip/flash, `?sprites=1` sheet, smoke assertion, player idle/walk/hit.
2. Enemies: each type a distinct 16x16 silhouette with a walk cycle and a baked shadow (one family per PR if large).
3. Bosses: 24-32 px sprites.
4. Projectiles and weapon effects with impact sparks (8x8, pooled).
5. Pickups: gems, coins, hearts, chests (8x8).
6. Ground: tile-based floor with 4-6 tile variants, plus props (trees, rocks, mushrooms) for depth.
7. HUD, level-up cards and menus with a pixel font from our own glyph grid.
8. Crowded-scene perf check (300+ enemies on a phone) and final screenshots.

### Slice 8 results (2026-10-31, `tests/perf.js`)

Headless Chromium (software rendering), 390 px viewport, all weapons at level 3, average ms per frame over 120 frames:

| Enemies | CPU x1 update + render | CPU x4 update + render |
| --- | --- | --- |
| 100 | 0.2 + 0.9 | 0.8 + 3.6 |
| 300 | 0.3 + 1.7 | 1.3 + 5.7 |
| 600 | 0.9 + 2.7 | 2.4 + 12.3 |

300+ enemies fit the 16.7 ms budget at 4x throttle with room to spare; 600 is near the limit. Single frames spike to about 30-38 ms at 600 enemies (likely garbage collection from per-frame allocations); worth a look if a real phone stutters in late-game hordes. Not yet checked on a real device.

Each slice: one PR, before and after screenshots at 390 px and desktop (sprite sheet and gameplay), smoke test passing, no mechanics, balance or control changes.
