# Tone Zone Survivors: art direction

Goal: read as one game, not a pile of random shapes. Dark-fantasy woodland arena at night, navy and moss ground, warm gold and cyan magic. All art is drawn procedurally in code (canvas paths, cached offscreen canvases). No third-party or copyrighted art. No new dependencies.

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

## Slices (ordered backlog)

1. Done: woodland floor and enemy ground shadows (#55). HUD plates and 390 px fix (#58). End-screen panel (#59).
2. Title screen and character cards on navy plates (game.js title block, ~line 590-610).
3. Upgrade / level-up cards (levelup block, ~line 660-675).
4. Player: idle, walk and hit animation, class silhouette (keep collision).
5. Enemy families: silhouettes from this doc, 2-4 frame loops, shadows on all ground units (keep collision and radii).
6. Pickups by shape: XP gem, coin, heart, chest, bomb, ice (pooled).
7. Weapon projectile shapes and hit particles (pooled, capped).
8. Terrain depth: tile variety, props, subtle parallax layer.
9. Damage numbers and shake tuned to this doc.
10. Crowded-scene perf check and final before/after screenshots at 390x844 and desktop.

Each slice: one PR, before and after screenshots at 390 px and desktop, smoke test passing, no mechanics or balance changes.
