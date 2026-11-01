// Tone Zone Survivors - pixel sprite pipeline (see docs/ART.md).
// Sprites are palette-indexed pixel grids (one char per pixel, '.' = transparent).
// At load each frame is baked once into an offscreen canvas: an Ink 1px outline is
// added around every filled pixel (4-neighbour), plus a Bone hit-flash copy and a
// mirrored copy. Draw with drawSprite() at an integer scale with smoothing off.
(() => {
'use strict';
// 12-colour palette from docs/ART.md, plus shade/light steps mixed from those hues.
const BASE = {
  ink: '#0b1020', night: '#1e2a4a', dusk: '#2a3a63', mossD: '#23402f', moss: '#3f7a4a', stone: '#64708a',
  bone: '#e2e8f0', gold: '#fbbf24', cyan: '#38bdf8', ember: '#f97316', blood: '#ef4444', violet: '#a78bfa',
};
function mix(a, b, t) {
  const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  let s = '#';
  for (let i = 0; i < 3; i++) s += Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0');
  return s;
}
const shade = c => mix(c, BASE.ink, 0.45), light = c => mix(c, BASE.bone, 0.45);
// Pixel keys. Lower-case = palette colour; 'b' 'B' 'h' are the body base/shade/light slot
// that per-character variants override.
const PAL = {
  k: BASE.ink, n: BASE.night, d: BASE.dusk, g: BASE.mossD, m: BASE.moss, s: BASE.stone, w: BASE.bone,
  y: BASE.gold, o: shade(BASE.gold), c: BASE.cyan, e: BASE.ember, r: BASE.blood,
  v: BASE.violet, u: shade(BASE.violet), l: light(BASE.violet),
  b: BASE.violet, B: shade(BASE.violet), h: light(BASE.violet),
  j: mix(BASE.moss, BASE.bone, 0.3), t: '#7c4a2a', T: '#5a3320', W: '#a9b4c6',
};
function bodySlots(c) { return { b: c, B: shade(c), h: light(c) }; }

// ---- sprite definitions ----
// Player (16x16): hooded caster with a gold crown and violet cloak, facing right,
// light from the top-left. Body rows are shared; legs/bob vary per frame.
const P_BODY = [
  '......y.y.y.....',
  '......yyyyy.....',
  '.....hhhbbbb....',
  '....hhbbbbbbB...',
  '....hbwwwwkwB...',
  '....hbwwwwkwB...',
  '....lbbwwwwbB...',
  '...lvvbbbbbBuu..',
  '..lvvvbbybbBuuu.',
  '..lvvvvbbbBuuuu.',
  '..vvvvvvvuuuuu..',
  '...vvvvvvuuuu...',
];
const E = '................';
// legs: [rowBelowBody, extraRowWhenBobbed]
function pf(legs, bob) {
  // bob=1 lifts the body one pixel; legs then show two rows tall.
  return (bob ? [E, ...P_BODY, legs, legs, E, E] : [E, E, ...P_BODY, legs, E, E]).slice(0, 16);
}
const DEFS = {
  // Props (16x16, outlined, drawn under units): tree, rock, mushroom.
  tree: { size: 16, anims: { idle: [[
    '................',
    '.....mmmmmm.....',
    '...mmjjmmmmmm...',
    '..mmjjmmmmmmmg..',
    '..mjjmmmmmmmgg..',
    '..mmmmmmmmmggg..',
    '..mmmmmmmmgggg..',
    '...mmmmmmgggg...',
    '....ggmmgggg....',
    '......ggg.......',
    '.......tt.......',
    '.......tT.......',
    '.......tT.......',
    '......tttT......',
    '................',
    '................',
  ]] } },
  rock: { size: 16, anims: { idle: [[
    '................',
    '................',
    '................',
    '................',
    '......wwss......',
    '....wwsssssd....',
    '...wssssssssd...',
    '..wsssssssssdd..',
    '..sssssmssssdd..',
    '..sssssssssddd..',
    '..ssssssdddddd..',
    '...dddddddddd...',
    '................',
    '................',
    '................',
    '................',
  ]] } },
  mush: { size: 16, anims: { idle: [[
    '................',
    '................',
    '................',
    '................',
    '................',
    '......rrrr......',
    '....rrwrrrrr....',
    '...rrrrrwrrrr...',
    '...rwrrrrrrrr...',
    '...rrrrrrrwrr...',
    '....dddddddd....',
    '......wwww......',
    '......wwWw......',
    '......wwWw......',
    '.....wwwwWw.....',
    '................',
  ]] } },
  // Graveyard props (spooky theme): bare dead tree, headstone, grave cross, jack-o'-lantern.
  deadtree: { size: 16, anims: { idle: [[
    '................',
    '..T.......T.....',
    '..tT...T..tT....',
    '...tT..tT.t..T..',
    '.T..tT.t.tT.tT..',
    '.tT..ttt.t.tT...',
    '..ttT.tttttT....',
    '....ttttttT.....',
    '......ttT.......',
    '......ttT.......',
    '......ttT.......',
    '......ttT.......',
    '.....tttTT......',
    '....tT.tT.TT....',
    '................',
    '................',
  ]] } },
  grave: { size: 16, anims: { idle: [[
    '................',
    '................',
    '................',
    '......wwss......',
    '.....wsssss.....',
    '....wsssssss....',
    '....ssdsddsd....',
    '....sssssssd....',
    '....ssddddsd....',
    '....sssssssd....',
    '....ssssssdd....',
    '....sssssddd....',
    '..gmmsssdddmg...',
    '..gggmmggmggg...',
    '................',
    '................',
  ]] } },
  cross: { size: 16, anims: { idle: [[
    '................',
    '................',
    '.......ws.......',
    '.......sd.......',
    '.....wwssss.....',
    '.....sssddd.....',
    '.......sd.......',
    '.......sd.......',
    '.......sd.......',
    '.......sd.......',
    '.......sd.......',
    '......gsdg......',
    '....gTTTTTTg....',
    '...gTTTTTTTTg...',
    '................',
    '................',
  ]] } },
  pumpkin: { size: 16, anims: { idle: [[
    '................',
    '................',
    '................',
    '................',
    '.......gm.......',
    '........g.......',
    '....eeeeeeee....',
    '...eeyeeeeyee...',
    '..eeyyyeeyyyeo..',
    '..eeeeeyeeeeeo..',
    '..eeyeyyyyeyeo..',
    '..eeeyyeyyeeoo..',
    '...eeeeeeeeoo...',
    '....oooooooo....',
    '................',
    '................',
  ]] } },
  player: {
    size: 16,
    anims: {
      idle: [pf('.....uu..uu.....', 0), pf('.....uu..uu.....', 1)],
      walk: [pf('....uu....uu....', 0), pf('.....uu.uu......', 1), pf('...uu....uu.....', 0), pf('......uu.uu.....', 1)],
    },
  },
};

// Enemies (16x16): symmetric front-facing silhouettes, 2 frames each. Body slot b/B/h is tinted by
// the enemy colour through variant(). fit() pads a short row list to 16 rows (top empty rows).
function fit(rows, top) { const o = []; for (let i = 0; i < top; i++) o.push(E); o.push(...rows); while (o.length < 16) o.push(E); return o; }
const ENEMY = {
  bat: [fit([
    '.bb..........bb.', '.bbb...bb...bbb.', '.bbbb.bbbb.bbbb.', '.bBbbbbbbbbbbBb.',
    '..Bbbwkbbkwbbb..', '..B.bbbbbbbb.B..', '......bwwb......', '.......bb.......'], 3),
  fit([
    '......b..b......', '.....bbbbbb.....', '..b.bbwkkwbb.b..', '.bbbbbbbbbbbbbb.',
    '.bB.bbbwwbbb.Bb.', '..B..bbbbbb..B..', '.....B.bb.B.....'], 4)],
  ghoul: [[
    '....hbbbbbbB....', '...hbwkbbkwbB...', '...hbbbbbbbbB...', '....bbwrrwbB....', '..bb.hbbbbB.bb..',
    '..bb.hbbbbB.bb..', '..Bb.hbbbbB.bB..', '..B..BbbbbB..B..', '......bbbb......', '.....bb..bb.....'],
  [
    '....hbbbbbbB....', '...hbwkbbkwbB...', '...hbbbbbbbbB...', '....bbwrrwbB....', '..bb.hbbbbB.bb..',
    '..bb.hbbbbB.bb..', '..Bb.hbbbbB.bB..', '..B..BbbbbB..B..', '......bbbb......', '....bb....bb....']].map(r => fit(r, 3)),
  imp: [['...w........w...', '...ww......ww...', '....whbbbbBw....', '....hbbbbbbB....', '....bwkbbkwB....', '....bbbbbbbB....',
    '.....bbwwbB.....', '..hh.hbbbbB.hh..', '..bB.BbbbbB.bB..', '.....bbbbbB.....', '....bbB..bbB....'],
  ['...w........w...', '...ww......ww...', '....whbbbbBw....', '....hbbbbbbB....', '....bwkbbkwB....', '....bbbbbbbB....',
    '.....bbwwbB.....', '..hh.hbbbbB.hh..', '..bB.BbbbbB.bB..', '.....bbbbbB.....', '...bbB....bbB...']].map(r => fit(r, 3)),
  brute: [['..w..........w..', '..ww........ww..', '...whbbbbbbBw...', '...hbbbbbbbbB...', '...bwkbbbbkwB...', '...bbbbbbbbbB...',
    '...bbwwwwwwbB...', '.hhhhbbbbbbBBB..', 'hhbbbhbbbbBbBBB.', 'hbbbbbbbbbbbbBB.', 'hbbb.hbbbbB.bBB.', '.bb..BbbbbbB..bB',
    '....bbbbbbbB....', '....bbb..bbB....', '...bbbb..bbbB...'],
  ['..w..........w..', '..ww........ww..', '...whbbbbbbBw...', '...hbbbbbbbbB...', '...bwkbbbbkwB...', '...bbbbbbbbbB...',
    '...bbwwwwwwbB...', '.hhhhbbbbbbBBB..', 'hhbbbhbbbbBbBBB.', 'hbbbbbbbbbbbbBB.', 'hbbb.hbbbbB.bBB.', '.bb..BbbbbbB..bB',
    '....bbbbbbbB....', '...bbb....bbB...', '..bbbb....bbbB..']].map(r => fit(r, 1)),
  golem: [['....bbbbbbbb....', '...hbbbbbbbbB...', '...hbeebbeebB...', '...hbbbbbbbbB...', '..hhhbbbbbbBBB..', '.hhbbhbbbbBbBBB.',
    '.hbbbhbbbbBbbBB.', '.hbbbbbbbbbbbBB.', '.BbbBbbbbbbBBbB.', '.BBB.hbbbbbB.BB.', '....hbbbbbbB....', '....hbbbbbbB....',
    '...hbbbB.bbbB...', '...BBBB..BBBB...'],
  ['....bbbbbbbb....', '...hbbbbbbbbB...', '...hbeebbeebB...', '...hbbbbbbbbB...', '..hhhbbbbbbBBB..', '.hhbbhbbbbBbBBB.',
    '.hbbbhbbbbBbbBB.', '.hbbbbbbbbbbbBB.', '.BbbBbbbbbbBBbB.', '.BBB.hbbbbbB.BB.', '....hbbbbbbB....', '....hbbbbbbB....',
    '...hbbB..hbbB...', '...BBB....BBB...']].map(r => fit(r, 1)),
  wisp: [['.......h........', '......hbb.......', '.....hbbbB......', '....hbbbbbB.....', '....hbwwbbbB....', '...hbbwwwbbbB...',
    '...bbbwwwbbbB...', '...bbbbwbbbbB...', '...BbbbbbbbbB...', '....BbbbbbbB....', '.....BBbbBB.....', '......BBBB......'],
  ['......h.........', '.....hbb........', '.....hbbbB......', '....hbbbbbB.....', '....hbwwbbbB....', '...hbbwwwbbbB...',
    '...bbbwwwbbbB...', '...bbbbwbbbbB...', '...BbbbbbbbbB...', '....BbbbbbbB....', '.....BbbBB......', '.......BB.......']].map(r => fit(r, 2)),
  bloat: [['....hhbbbbbB....', '...hhbbbbbbbB...', '..hbbbbbbbbbbB..', '..hbbwkbbkwbbB..', '.hbbbbbbbbbbbbB.',
    '.hbbbbbwwbbbbbB.', '.hbbbbwrrwbbbbB.', '.bbbbbbbwwbbbbB.', '.BbbbbbbbbbbbBB.', '..BbbbbbbbbbBB..', '...BBbbbbbBBB...', '....BBBBBBBB....'],
  ['....hhbbbbbB....', '...hhbbbbbbbB...', '..hbbbbbbbbbbB..', '..hbbwkbbkwbbB..', '.hbbbbbbbbbbbbB.',
    '.hbbbbbwwbbbbbB.', '.hbbbbwrrwbbbbB.', '.bbbbbbbwwbbbbB.', '.BbbbbbbbbbbbBB.', '.BBbbbbbbbbbBBB.', '..BBBbbbbbBBBB..', '..BBBBBBBBBBBB..']].map((r, i) => fit(r, 2 + i)),
  dasher: [['.....hhbbbbB....', '....hbbbbbbbB...', '....bwkbbbkwbB..', '....bbbbbbbbbB..', 'ww..hbbbbbbB....', 'w..hbbbbbbbbB...',
    'ww.hbbbbbbbbbB..', '...BbbbbbbbBB...', '.....bb...bb....'],
  ['.....hhbbbbB....', '....hbbbbbbbB...', '....bwkbbbkwbB..', '....bbbbbbbbbB..', '.w..hbbbbbbB....', 'ww.hbbbbbbbbB...',
    '.w.hbbbbbbbbbB..', '...BbbbbbbbBB...', '....bb.....bb...']].map(r => fit(r, 4)),
  troll: [['....g.g..g......', '...ggbbbbbgg....', '...hbbbbbbbB....', '...bwkbbbkwB....', '...bbbbhbbbB....', '....bbwwwbB.....',
    '..hhhbbbbbbBB...', '.hbbhbbbbbbBBo..', '.hbbbbbbbbbBBo..', '.BbbBbbbbbbBooo.', '..BB.bbbbbbB.oo.', '....bbbbbbbB....', '....bbb..bbB....', '...bbbb..bbbB...'],
  ['....g.g..g......', '...ggbbbbbgg....', '...hbbbbbbbB....', '...bwkbbbkwB....', '...bbbbhbbbB....', '....bbwwwbB.....',
    '..hhhbbbbbbBB...', '.hbbhbbbbbbBBo..', '.hbbbbbbbbbBBo..', '.BbbBbbbbbbBooo.', '..BB.bbbbbbB.oo.', '....bbbbbbbB....', '...bbb....bbB...', '..bbbb....bbbB..']].map(r => fit(r, 1)),
};
for (const k in ENEMY) DEFS[k] = { size: 16, anims: { walk: ENEMY[k] } };

// Boss (32x32): horned, crowned brute. Authored as the left half (16 cols) of each row and mirrored
// at load with the h/B light/shade slots swapped so light stays top-left-ish. 2-frame stomp.
const mirror = h => h + h.split('').reverse().map(c => c === 'h' ? 'B' : c === 'B' ? 'h' : c).join('');
const BOSS_TOP = [
  '.............w..', '............ww..', '...........wwy..', '..w....y..yyyy..', '..ww...yyyyyyyo.',
  '...wwhhbbbbbbbbb', '....hhbbbbbbbbbb', '...hhbbwwwwbbbbb', '...hbbwkkwwbbbbb', '...hbbwkeewbbbbb',
  '...hbbbwwwwbbbbb', '....bbbbbbbbbbbw', '....bBbbbwwwwwkw', '.....BbbbbwwwwwB',
  '..hhhhhbbbbbbbbb', '.hhhbbhbbbbbbbbb', 'hhbbbbbhbbbbbbbb', 'hbbbbbbbhbbbyyyy', 'hbbbbbbbbbbbyoyy',
  'hbbbBbbbbbbbyyoo', 'hbbbBbbbbbbbbbbb', '.BBbBbbbbbbbbbbb', '..BBBBbbbbbbbbbB', '....BBBbbbbbbbbB',
];
const BOSS_LEGS = [
  ['....hbbbbbbbbbbb', '....hbbbbbbbbbbb', '...hbbbbbbBBBBBB', '...hbbbB........', '..hbbbbB........', '..BBBBBB........'],
  ['....hbbbbbbbbbbb', '....hbbbbbbbbbbb', '....hbbbbbBBBBBB', '....hbbbB.......', '....hbbbB.......', '...BBBBBB.......'],
];
DEFS.boss = { size: 32, anims: { walk: BOSS_LEGS.map(l => { const r = BOSS_TOP.concat(l).map(mirror); r.unshift(mirror('................')); while (r.length < 32) r.push(mirror('................')); return r; }) } };

// Pickups (8x8, 1-frame 'idle'; art stays inside the 6x6 centre so the baked outline fits).
// Tinted by variant(): gem cyan / pink, heart rose, chest brown.
const PICKUP = {
  gem: ['........', '...hb...', '..hbbB..', '.hwbbbB.', '.hbbbbB.', '..BbbB..', '...BB...', '........'],
  heart: ['........', '.bb..bb.', '.hbbbbB.', '.bbbbbB.', '.BbbbbB.', '..BbbB..', '...BB...', '........'],
  boom: ['........', '.bb.....', '.hbb....', '..hbbbB.', '...hbbbb', '....bB..', '.....B..', '........'],
  bomb: ['.....yo.', '....y...', '..hbbbb.', '.hbbbbbB', '.bbbbbbB', '.bbbbbbB', '..BbbbB.', '........'],
  ice: ['...hb...', '..hwbB..', '.hwbbbB.', 'hwbbbbbB', '.hbbbbB.', '..hbbB..', '...BB...', '........'],
  vac: ['..bbbb..', '.bB..bB.', 'bB.ww.bB', 'b..ww..B', 'b..ww..B', 'bB....BB', '.bB..bB.', '..BBBB..'],
  chest: ['........', '.hbbbbB.', '.hbbbbB.', '.yyyyyy.', '.bbyyBB.', '.bbbbbB.', '.BBBBBB.', '........'],
  bolt: ['........', '........', '..hbbb..', '.hwwwbB.', '.hwwwbB.', '..BbbB..', '........', '........'],
  orb: ['........', '..hbb...', '.hwbbB..', '.hbbbB..', '.bbbBB..', '..BBB...', '........', '........'],
  mine: ['........', '...yy...', '..bbbB..', '.bhbbbB.', '.bbbbBB.', '..BBBB..', '........', '........'],
  // Farming: grass tuft (choppable prop), seed + wood loot, sprout and ripe crop (body slot = crop colour).
  grass: ['........', '..j..j..', '.jm.jm..', '.mmjmm..', '.gmmmgj.', '.ggmgg..', '..gggg..', '........'],
  seed: ['........', '........', '...hb...', '..hbbB..', '..bbbB..', '...BB...', '........', '........'],
  wood: ['........', '........', '..tttty.', '.tTtTtyo', '.TTTTToy', '..TTTTo.', '........', '........'],
  sprout: ['........', '...m.j..', '..jm.m..', '...mm...', '...m....', '..tTTt..', '.tTTTTt.', '........'],
  crop: ['........', '...mg...', '..hbbB..', '.hbhbbB.', '.bbbbbB.', '.bbbbBB.', '..BBBB..', '........'],
};
for (const k in PICKUP) DEFS[k] = { size: 8, anims: { idle: [PICKUP[k]] } };
DEFS.minibloat = DEFS.bloat;

// ---- baking ----
function bakeGrid(rows, size, pal, mode) {
  if (rows.length !== size) throw new Error('sprite rows ' + rows.length + ' != ' + size);
  const px = [];
  for (let y = 0; y < size; y++) {
    const r = rows[y];
    if (r.length !== size) throw new Error('sprite row ' + y + ' width ' + r.length + ' != ' + size + ' "' + r + '"');
    for (let x = 0; x < size; x++) {
      const ch = r[mode === 'flip' ? size - 1 - x : x];
      if (ch !== '.' && !pal[ch]) throw new Error('unknown pixel key ' + ch);
      px.push(ch === '.' ? null : ch);
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= size || y >= size) ? null : px[y * size + x];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const ch = at(x, y);
    let col = null;
    if (ch) col = mode === 'flash' && ch !== 'k' ? BASE.bone : pal[ch];
    else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) col = BASE.ink; // baked outline
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
function bake(name, over) {
  const d = DEFS[name], pal = over ? Object.assign({}, PAL, over) : PAL, out = { size: d.size, anims: {} };
  for (const a in d.anims) {
    const fr = d.anims[a];
    out.anims[a] = {
      frames: fr.map(f => bakeGrid(f, d.size, pal)),
      flip: fr.map(f => bakeGrid(f, d.size, pal, 'flip')),
      flash: fr.map(f => bakeGrid(f, d.size, pal, 'flash')),
    };
  }
  return out;
}

// Ground tiles (16x16, no outline, drawn at 2x): plain Night base with sparse dusk/moss/stone
// pixels. Variant 0-1 are mostly plain so the floor stays calm under the action.
const TILE_BASE = '#191c33'; // graveyard: colder, slightly violet night
const TILE_DEFS = [
  [],
  [[3, 4, 'd'], [11, 9, 'd'], [7, 13, 'd']],
  [[2, 3, 'd'], [3, 3, 'd'], [12, 11, 'd'], [13, 11, 'd'], [8, 7, 'u']],
  [[4, 10, 'g'], [5, 10, 'g'], [5, 9, 'g'], [10, 4, 'g'], [10, 3, 'd'], [11, 4, 'g']],
  [[6, 6, 's'], [7, 6, 'W'], [6, 7, 'd'], [7, 7, 'd'], [12, 12, 'u']],
  [[3, 12, 'T'], [4, 12, 'T'], [5, 12, 'T'], [4, 11, 'g'], [11, 5, 'u'], [13, 3, 'd']],
];
const tiles = TILE_DEFS.map(list => {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d'); g.fillStyle = TILE_BASE; g.fillRect(0, 0, 16, 16);
  for (const [x, y, k] of list) { g.fillStyle = k === 'y' ? '#a07c1c' : PAL[k]; g.fillRect(x, y, 1, 1); }
  return c;
});
// Pixel font: 5x7 glyphs, 1 string per row ('#' = lit). Upper-case only (text is upper-cased).
const FONT = {
  'A': '.###./#...#/#...#/#####/#...#/#...#/#...#',
  'B': '####./#...#/#...#/####./#...#/#...#/####.',
  'C': '.###./#...#/#..../#..../#..../#...#/.###.',
  'D': '####./#...#/#...#/#...#/#...#/#...#/####.',
  'E': '#####/#..../#..../####./#..../#..../#####',
  'F': '#####/#..../#..../####./#..../#..../#....',
  'G': '.###./#...#/#..../#.###/#...#/#...#/.####',
  'H': '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  'I': '.###./..#../..#../..#../..#../..#../.###.',
  'J': '..###/...#./...#./...#./...#./#..#./.##..',
  'K': '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  'L': '#..../#..../#..../#..../#..../#..../#####',
  'M': '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  'N': '#...#/#...#/##..#/#.#.#/#..##/#...#/#...#',
  'O': '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  'P': '####./#...#/#...#/####./#..../#..../#....',
  'Q': '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  'R': '####./#...#/#...#/####./#.#../#..#./#...#',
  'S': '.####/#..../#..../.###./....#/....#/####.',
  'T': '#####/..#../..#../..#../..#../..#../..#..',
  'U': '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  'V': '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  'W': '#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.',
  'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  'Y': '#...#/#...#/#...#/.#.#./..#../..#../..#..',
  'Z': '#####/....#/...#./..#../.#.../#..../#####',
  '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  '1': '..#../.##../..#../..#../..#../..#../.###.',
  '2': '.###./#...#/....#/...#./..#../.#.../#####',
  '3': '#####/...#./..#../...#./....#/#...#/.###.',
  '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
  '5': '#####/#..../####./....#/....#/#...#/.###.',
  '6': '..##./.#.../#..../####./#...#/#...#/.###.',
  '7': '#####/....#/...#./..#../.#.../.#.../.#...',
  '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
  '9': '.###./#...#/#...#/.####/....#/...#./.##..',
  ' ': '...../...../...../...../...../...../.....',
  '.': '...../...../...../...../...../.##../.##..',
  ',': '...../...../...../...../.##../..#../.#...',
  ':': '...../.##../.##../...../.##../.##../.....',
  '!': '..#../..#../..#../..#../..#../...../..#..',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  '-': '...../...../...../#####/...../...../.....',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '%': '##.../##..#/...#./..#../.#.../#..##/...##',
  '/': '....#/....#/...#./..#../.#.../#..../#....',
  '(': '...#./..#../.#.../.#.../.#.../..#../...#.',
  ')': '.#.../..#../...#./...#./...#./..#../.#...',
  '<': '...#./..#../.#.../#..../.#.../..#../...#.',
  '>': '.#.../..#../...#./....#/...#./..#../.#...',
  '\'': '..#../..#../.#.../...../...../...../.....',
  '=': '...../...../#####/...../#####/...../.....',
  '*': '...../..#../#.#.#/.###./#.#.#/..#../.....',
  '#': '.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.',
  '[': '.###./.#.../.#.../.#.../.#.../.#.../.###.',
  ']': '.###./...#./...#./...#./...#./...#./.###.',
  '_': '...../...../...../...../...../...../#####',
  '"': '.#.#./.#.#./...../...../...../...../.....',
  '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
  ';': '...../.##../.##../...../.##../..#../.#...',
  'x': '...../...../#...#/.#.#./..#../.#.#./#...#',
};
const glyphCache = {};
function glyphImg(ch, color) {
  const key = ch + color; if (glyphCache[key]) return glyphCache[key];
  const rows = (FONT[ch] || FONT['?']).split('/'), c = document.createElement('canvas'); c.width = 6; c.height = 8;
  const g = c.getContext('2d');
  // Ink drop shadow one pixel down-right, then the glyph
  g.fillStyle = BASE.ink;
  rows.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') g.fillRect(x + 1, y + 1, 1, 1); });
  g.fillStyle = color;
  rows.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') g.fillRect(x, y, 1, 1); });
  return (glyphCache[key] = c);
}
// Width in px of s at integer scale k (6px advance per glyph).
function fontWidth(s, k) { return s.length * 6 * k; }
// Draws s with its glyph-top at y (cap height 7k). align: center | left | right. Integer scale, smoothing off.
function drawText(ctx, s, x, y, k, color, align) {
  s = String(s).toUpperCase();
  const w = fontWidth(s, k); let px = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  px = Math.round(px); y = Math.round(y);
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < s.length; i++) if (s[i] !== ' ') ctx.drawImage(glyphImg(s[i], color), px + i * 6 * k, y, 6 * k, 8 * k);
}
const baked = {};
for (const n in DEFS) baked[n] = bake(n);
const variants = {};
// Cached per-colour variant (e.g. each playable character tints the body slot).
function variant(name, color) {
  const key = name + color;
  return variants[key] || (variants[key] = bake(name, bodySlots(color)));
}
function drawSprite(ctx, spr, anim, i, x, y, scale, opt) {
  const a = spr.anims[anim], n = a.frames.length, k = ((i % n) + n) % n;
  const img = opt && opt.flash ? a.flash[k] : opt && opt.flip ? a.flip[k] : a.frames[k];
  const s = spr.size * scale;
  ctx.drawImage(img, Math.round(x - s / 2), Math.round(y - s / 2), s, s);
}
// Sprite sheet for screenshot review (?sprites=1): every sprite, anim and frame on a grid,
// plus flipped and hit-flash rows.
function drawSheet(ctx, W, H, t) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = BASE.night; ctx.fillRect(0, 0, W, H);
  const scale = W < 500 ? 3 : 4;
  ctx.fillStyle = BASE.bone; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('SPRITE SHEET  scale x' + scale, 12, 10);
  let y = 40;
  tiles.forEach((t, i) => ctx.drawImage(t, 12 + i * (16 * scale + 4), y - 4, 16 * scale, 16 * scale));
  y += 16 * scale + 8;
  for (const name in baked) {
    const spr = baked[name], cell = spr.size * scale + 8;
    for (const a in spr.anims) {
      const an = spr.anims[a];
      ctx.fillStyle = BASE.gold; ctx.font = '12px monospace';
      ctx.fillText(name + '.' + a + ' (' + an.frames.length + 'f, ' + spr.size + 'px)', 12, y);
      y += 16;
      const rows = [['', an.frames], ['flip', an.flip], ['hit', an.flash]];
      for (const [lab, list] of rows) {
        let x = 12;
        list.forEach(img => {
          ctx.fillStyle = BASE.dusk; ctx.fillRect(x, y, cell - 4, cell - 4);
          ctx.drawImage(img, x + 2, y + 2, spr.size * scale, spr.size * scale);
          x += cell;
        });
        // live loop of the anim at the end of the first row
        if (!lab) {
          const k = ((t * 8) | 0) % list.length;
          ctx.fillStyle = BASE.mossD; ctx.fillRect(x + 8, y, cell - 4, cell - 4);
          ctx.drawImage(list[k], x + 10, y + 2, spr.size * scale, spr.size * scale);
        } else { ctx.fillStyle = BASE.stone; ctx.fillText(lab, x + 4, y + 4); }
        y += cell;
      }
      y += 6;
    }
  }
}
window.TZS_SPRITES = { FONT, glyphImg, fontWidth, drawText, tiles, PAL, BASE, DEFS, baked, variant, drawSprite, drawSheet, mix };
})();
