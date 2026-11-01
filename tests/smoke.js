// Headless smoke test: node tests/smoke.js  (needs playwright + chromium)
// Env: CHROMIUM=/path/to/chrome overrides the browser; NODE_PATH points at a dir containing 'playwright'.
const fs = require('fs');
const path = require('path');
const executablePath = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
let runnable = false;
try { fs.accessSync(executablePath, fs.constants.X_OK); runnable = fs.statSync(executablePath).isFile(); } catch (e) {}
if (!runnable) {
  console.error('smoke: no browser at ' + executablePath + '. Set CHROMIUM=/path/to/chromium or run `npx playwright install chromium` and point CHROMIUM at it.');
  process.exit(2);
}
let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error("smoke: cannot load 'playwright'. Install it (npm i -g playwright) and run with NODE_PATH=$(npm root -g) node tests/smoke.js");
  process.exit(2);
}
(async () => {
  const b = await chromium.launch({ executablePath });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate(() => {
    const t = window.__tzs; t.start();
    for (let i = 0; i < 60 * 60; i++) { t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break; }
    t.render();
    return { state: t.state, time: t.G.t, kills: t.G.kills, lvl: t.G.p.lvl, hp: t.G.p.hp, enemies: t.G.enemies.length };
  });
  const meta = await pg.evaluate(() => {
    const t = window.__tzs; localStorage.setItem('tzs_gold', 100); localStorage.removeItem('tzs_meta');
    t.state = 'title'; t.press('1');
    const g = +localStorage.getItem('tzs_gold'); t.start();
    return { gold: g, maxHp: t.G.p.maxHp };
  });
  if (meta.gold !== 80 || meta.maxHp !== 130) { console.log('meta upgrade failed', JSON.stringify(meta)); errs.push('meta'); }
  const chr = await pg.evaluate(() => {
    const t = window.__tzs; t.state = 'title'; t.press('arrowright'); t.start();
    const o = { w: Object.keys(t.G.w).join(), maxHp: t.G.p.maxHp };
    t.state = 'title'; t.press('arrowleft'); return o;
  });
  if (chr.w !== 'whip' || chr.maxHp !== 160) { console.log('char select failed', JSON.stringify(chr)); errs.push('char'); }
  const hm = await pg.evaluate(() => { const t = window.__tzs; t.state = 'title'; t.press('h'); t.start(); t.update(0.1); t.render(); t.state = 'title'; t.press('h'); return true; });
  const win = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); t.G.t = 599.99; t.G.p.hp = t.G.p.maxHp = 1e9; t.update(0.05); t.render();
    return { state: t.state, won: t.G.won, gold: t.G.gold };
  });
  if (win.state !== 'dead' || !win.won || win.gold < 200) { console.log('win failed', JSON.stringify(win)); errs.push('win'); }
  const dash = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const x0 = t.G.p.x; t.press('shift'); t.update(0.05); t.render();
    return { dx: t.G.p.x - x0, cd: t.G.p.dashCd };
  });
  const dbtn = await pg.evaluate(() => { const t = window.__tzs; t.touchUi = true; t.start(); t.render(); const b = t.dashBtn(); return { d: b.r * 2, hit: t.hitDash(b.x, b.y), W: innerWidth, bx: b.x, by: b.y, H: innerHeight }; });
  if (dbtn.d < 48 || !dbtn.hit || dbtn.bx > dbtn.W || dbtn.by > dbtn.H) { console.log('dash button failed', JSON.stringify(dbtn)); errs.push('dashbtn'); }
  // two-finger dash: stick finger holds LEFT, second finger taps (and jitters on) DASH; dash must go left and the stick must survive
  const dl = await pg.evaluate(() => {
    const t = window.__tzs, cv = document.getElementById('c'); t.touchUi = true; t.start(); const G = t.G; G.enemies.length = 0; G.spawnAcc = -1e9;
    const ev = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', bubbles: true }));
    const b = t.dashBtn();
    ev('pointerdown', 1, 200, 300); ev('pointermove', 1, 140, 300); t.update(0.05);
    const x0 = G.p.x; ev('pointerdown', 2, b.x, b.y); ev('pointermove', 2, b.x + 3, b.y + 2); t.update(0.05);
    const dashX = G.p.x - x0; ev('pointerup', 2, b.x, b.y); for (let i = 0; i < 5; i++) t.update(0.05);
    const stillLeft = G.p.x - x0 < dashX; ev('pointerup', 1, 140, 300);
    // keyboard: hold left, press Space
    t.start(); t.keys['a'] = true; const k0 = t.G.p.x; t.press(' '); t.update(0.05); const keyX = t.G.p.x - k0; t.keys['a'] = false;
    t.touchUi = false; return { dashX, stillLeft, keyX };
  });
  if (!(dl.dashX < -20) || !dl.stillLeft || !(dl.keyX < -20)) { console.log('dash direction failed', JSON.stringify(dl)); errs.push('dashdir'); }
  await pg.evaluate(() => { window.__tzs.touchUi = false; });
  if (dash.dx < 20 || dash.cd <= 0) { console.log('dash failed', JSON.stringify(dash)); errs.push('dash'); }
  const sum = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); t.G.w.bolt = 8; t.G.pa.haste = 2; return t.buildSummary();
  });
  if (!/\(EVO\)/.test(sum.wl) || !/ 2$/.test(sum.pl)) { console.log('summary failed', JSON.stringify(sum)); errs.push('summary'); }
  const rs = await pg.evaluate(() => { const t = window.__tzs; t.start(); t.G.bosses = 2; t.G.elites = 3; t.G.taken = 41; t.state = 'dead'; t.G.gold = 0; t.render(); return t.G.bosses; });
  if (rs !== 2) { console.log('run stats failed'); errs.push('runstats'); }
  const rst = await pg.evaluate(() => { const t = window.__tzs; t.start(); t.state = 'dead'; t.press(' '); const a = t.state; t.state = 'dead'; t.press('escape'); return a + ',' + t.state; });
  if (rst !== 'play,title') { console.log('restart failed', rst); errs.push('restart'); }
  const dsh = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.t = 250;
    const e = { x: G.p.x + 600, y: G.p.y, r: 10, hp: 30, maxHp: 30, speed: 60, dmg: 12, xp: 4, color: '#f472b6', flash: 0, kind: 'dasher', ct: 0.01 };
    G.enemies.push(e); const x0 = e.x; t.update(0.1); t.render();
    return { dx: x0 - e.x, lunge: e.lunge };
  });
  if (dsh.dx < 15 || !(dsh.lunge > 0)) { console.log('dasher failed', JSON.stringify(dsh)); errs.push('dasher'); }
  const tr = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.t = 300;
    const e = { x: G.p.x + 600, y: G.p.y, r: 15, hp: 35, maxHp: 70, speed: 0, dmg: 0, xp: 6, color: '#65a30d', flash: 0, kind: 'troll', hitT: 1.5 };
    G.enemies.push(e); t.update(0.5); const early = e.hp; t.update(1.5); t.render();
    return { early, late: e.hp };
  });
  if (tr.early !== 35 || !(tr.late > 40)) { console.log('troll failed', JSON.stringify(tr)); errs.push('troll'); }
  const el = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.hearts.length = 0; G.t = 200;
    const e = t.makeElite({ x: G.p.x + 600, y: G.p.y, r: 12, hp: 22, maxHp: 22, speed: 0, dmg: 9, xp: 2, color: '#6ee7b7', flash: 0, kind: 'ghoul' });
    G.enemies.push(e); t.render(); const big = { hp: e.hp, r: e.r }; e.hp = 0; t.update(0.016); const hearts = G.hearts.length;
    const orig = Math.random; Math.random = () => 0.01; G.enemies.length = 0; t.spawnEnemy(false); const spawned = !!(G.enemies[0] && G.enemies[0].elite);
    G.t = 100; G.enemies.length = 0; t.spawnEnemy(false); const early = !!(G.enemies[0] && G.enemies[0].elite); Math.random = orig;
    return { big, hearts, spawned, early };
  });
  if (el.big.hp !== 55 || el.big.r !== 16 || el.hearts < 1 || !el.spawned || el.early) { console.log('elite failed', JSON.stringify(el)); errs.push('elite'); }
  const ln = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.spawnAcc = -1e9; G.p.hp = G.p.maxHp = 1e9;
    t.startLane({ x: 1, y: 0 }); const banner = G.bannerText; for (let i = 0; i < 10; i++) t.update(0.1); t.render(); const warned = G.enemies.length;
    for (let i = 0; i < 10; i++) t.update(0.1); t.render(); const w = G.enemies.filter(e => e.lane); w.forEach(e => { e.hp = e.maxHp = 1e9; }); const x0 = w.length ? w[0].x : 0, y0 = w.length ? w[0].y : 0; t.update(0.1); t.update(0.1);
    const moved = w.length ? { dx: w[0].x - x0, dy: Math.abs(w[0].y - y0) } : null;
    for (let i = 0; i < 20; i++) t.update(0.1);
    G.t = 2 * 75 - 0.01; G.nextHorde = 150; G.events = 1; G.lane = null; t.update(0.02); const second = !!G.lane;
    return { banner, warned, n: w.length, moved, done: G.lane === null || second, second };
  });
  if (ln.banner !== 'SWARM LANE!' || ln.warned !== 0 || ln.n < 3 || !ln.moved || ln.moved.dx < 30 || ln.moved.dy > 10 || !ln.second) { console.log('swarm lane failed', JSON.stringify(ln)); errs.push('lane'); }
  // farming: chop a tree (wood + loot pulled in), plant a seed, trample, harvest a ripe crop, wood sells for gold
  const fm = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.spawnAcc = -1e9; G.nextHorde = G.nextBoss = 1e9;
    let tree = null; for (let gx = 1; gx < 40 && !tree; gx++) for (let gy = -5; gy < 5 && !tree; gy++) { const pr = t.propAt(gx, gy); if (pr && pr.kind === 'tree') tree = pr; }
    G.p.x = tree.x; G.p.y = tree.y; t.update(0.5); const chopping = !!G.chop && G.chop.kind === 'tree';
    for (let i = 0; i < 30; i++) t.update(0.1);
    t.render(); const cut = G.cut.has(tree.key), wood = G.wood, chopped = G.chopped;
    G.p.x = tree.x + 3000; G.p.y = tree.y; t.update(0.02);
    G.seeds = 0; const noSeed = t.plant(); G.seeds = 2; const planted = t.plant(); const tooClose = t.plant();
    const crop = G.crops[0]; t.update(1); t.render(); const grew = crop.age > 0.9;
    // trample: an enemy parked on a growing crop destroys it
    G.p.x += 300; t.update(0.02); G.seeds = 1; t.plant(); const c2 = G.crops[1];
    G.enemies.push({ x: c2.x, y: c2.y, r: 9, hp: 1e9, maxHp: 1e9, speed: 0, dmg: 0, xp: 1, color: '#a78bfa', flash: 0, kind: 'bat' });
    for (let i = 0; i < 25; i++) t.update(0.1); const trampled = !G.crops.includes(c2); G.enemies.length = 0;
    // harvest a ripe golden crop: heal + XP gem + WELL FED
    crop.age = crop.grow; crop.golden = true; G.p.hp = 50; const xp0 = G.p.xp + G.p.lvl * 1000;
    G.p.x = crop.x; G.p.y = crop.y; t.update(0.02); t.render();
    const harvested = { hp: G.p.hp, n: G.harvests, gem: G.p.xp + G.p.lvl * 1000 > xp0, fed: G.p.fed > 0, gone: !G.crops.includes(crop) };
    G.state = 'play'; G.p.hp = 1e9; G.t = 599.99; t.update(0.05); t.render();
    return { chopping, cut, wood, chopped, noSeed, planted, tooClose, grew, trampled, harvested, gold: G.gold, kills: G.kills, t: G.t };
  });
  const fmGold = Math.round(fm.kills + Math.floor(fm.t / 10) + 200 + fm.wood);
  if (!fm.chopping || !fm.cut || fm.wood < 2 || fm.chopped !== 1 || fm.noSeed || !fm.planted || fm.tooClose || !fm.grew || !fm.trampled
    || fm.harvested.hp !== 90 || fm.harvested.n !== 1 || !fm.harvested.gem || !fm.harvested.fed || !fm.harvested.gone || fm.gold !== fmGold) { console.log('farming failed', JSON.stringify(fm)); errs.push('farm'); }
  const pbtn = await pg.evaluate(() => { const t = window.__tzs; t.touchUi = true; t.start(); t.G.seeds = 1; t.render(); const b = t.plantBtn(), d = t.dashBtn(); const r = { d: b.r * 2, hit: t.hitPlant(b.x, b.y), apart: Math.hypot(b.x - d.x, b.y - d.y) > b.r + d.r }; t.touchUi = false; return r; });
  if (pbtn.d < 48 || !pbtn.hit || !pbtn.apart) { console.log('plant button failed', JSON.stringify(pbtn)); errs.push('plantbtn'); }
  const chs = await pg.evaluate(() => {
    const t = window.__tzs, out = {}; t.state = 'title';
    for (let i = 0; i < 6; i++) { t.render(); t.start(); const G = t.G; out[Object.keys(G.w)[0]] = Math.round(G.p.speed); t.state = 'title'; t.press('arrowright'); }
    t.state = 'title'; t.press('arrowleft'); t.start(); const G = t.G; G.enemies.length = 0; G.timers.zap = 0;
    const mk = (dx) => ({ x: G.p.x + dx, y: G.p.y, r: 10, hp: 1000, maxHp: 1000, speed: 0, dmg: 0, xp: 1, color: '#a78bfa', flash: 0, kind: 'bat' });
    G.enemies.push(mk(100), mk(120)); t.update(0.02);
    t.state = 'title'; t.press('arrowright'); // back to the first character
    return { out, splash: G.p.zapSplash, hurt: G.enemies.filter(e => e.hp < 1000).length };
  });
  if (chs.out.mine !== 126 || chs.out.zap !== 140 || chs.splash !== 40 || chs.hurt !== 2) { console.log('characters failed', JSON.stringify(chs)); errs.push('chars'); }
  const fr = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.shots.length = 0; G.w.frost = 1; G.timers.frost = 0;
    t.update(0.02); const shards = G.shots.filter(s => s.frost);
    const e = { x: 0, y: 0, r: 10, hp: 500, maxHp: 500, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' };
    // place the enemy on a live shard before the next update so the shard hits it deterministically
    const s = shards[0]; e.x = s.x + s.vx * 0.02; e.y = s.y + s.vy * 0.02; G.enemies.push(e);
    t.update(0.02); t.render();
    // a longer existing slow (e.g. from a stronger effect) must not be shortened by a frost hit
    G.shots.length = 0; G.enemies.length = 0; const e2 = { x: 0, y: 0, r: 10, hp: 500, maxHp: 500, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat', slow: 3 };
    G.timers.frost = 0; t.update(0.02); const s2 = G.shots.find(s => s.frost);
    e2.x = s2.x + s2.vx * 0.02; e2.y = s2.y + s2.vy * 0.02; G.enemies.push(e2);
    const slowBefore = e2.slow; t.update(0.02); t.render();
    // evolve path: maxed frost + maxed armor passive opened by a boss chest -> level 8 (EVO)
    G.enemies.length = 0; G.shots.length = 0; G.w.frost = 6; G.pa.armor = 5; G.texts.length = 0;
    G.chests.length = 0; G.chests.push({ x: G.p.x, y: G.p.y, dead: false }); t.update(0.02);
    return { n: shards.length, slow: e.slow, hp: e.hp, slowBefore, slowKept: e2.slow, e2hp: e2.hp, evoLvl: G.w.frost, evoText: G.texts.some(x => /EVOLVED/.test(x.s)) };
  });
  // the hit must land in the same tick, and must not shorten the existing slow (only one tick of decay allowed)
  const frOk = fr.n === 4 && fr.slow > 0 && fr.hp < 500 && fr.e2hp < 500 && fr.slowKept > 1.5 && fr.slowKept >= fr.slowBefore - 0.021;
  const evoOk = fr.evoLvl === 8 && fr.evoText;
  if (!frOk || !evoOk) { console.log('frost failed', JSON.stringify(fr)); errs.push('frost'); }
  const mn = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.w.mine = 1;
    t.update(0.02); const placed = G.mines.length; G.mines[0].age = 1;
    const e = { x: G.mines[0].x + 5, y: G.mines[0].y, r: 10, hp: 500, maxHp: 500, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' };
    G.enemies.push(e); t.update(0.02); t.render();
    return { placed, hp: e.hp, left: G.mines.length };
  });
  if (mn.placed !== 1 || mn.hp >= 500) { console.log('mine failed', JSON.stringify(mn)); errs.push('mine'); }
  // enemy ground shadows: drawImage calls are groundShadow + sprite per enemy plus 1 for the player sprite.
  // Expect 1 player + 40 on-screen enemies (2 each) + a boss (2; outside-margin one culled) (r 34) whose centre is inside the 160px cull margin; a boss outside the margin and 40 far enemies are culled.
  const sh = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.w.mine = 0;
    const cx = G.cam.x + 450, cy = G.cam.y + 300;
    const mk = (x, y, r) => ({ x, y, r, hp: 999, maxHp: 999, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' });
    for (let i = 0; i < 40; i++) G.enemies.push(mk(cx + (i % 8) * 50 - 175, cy + ((i / 8) | 0) * 50 - 100, 12));
    for (let i = 0; i < 40; i++) G.enemies.push(mk(cx + 3000 + i * 10, cy, 12));
    G.enemies.push(mk(G.cam.x - 150, cy, 34)); // boss-size, inside margin -> drawn
    G.enemies.push(mk(G.cam.x - 200, cy, 34)); // boss-size, outside margin -> culled
    const C = CanvasRenderingContext2D.prototype, orig = C.drawImage; let n = 0;
    C.drawImage = function (...a) { if (!(a[0].width === 6 && a[0].height === 8)) n++; // glyphs (pixel font) are not counted
      return orig.apply(this, a); };
    window.__tzsNoProps = true; // props (trees/rocks) are also drawImage calls; exclude them here
    try { t.render(); } finally { C.drawImage = orig; window.__tzsNoProps = false; }
    return { expected: 83, drawn: n };
  });
  if (sh.drawn !== sh.expected) { console.log('shadow cull failed', JSON.stringify(sh)); errs.push('shadow-cull'); }
  // sprite pipeline: every sprite bakes with the expected size and frame count (plus flip + hit-flash copies)
  const EXPECT = { player: { size: 16, idle: 2, walk: 4 }, boss: { size: 32, walk: 2 }, gem: { size: 8, idle: 1 }, heart: { size: 8, idle: 1 }, chest: { size: 8, idle: 1 }, bolt: { size: 8, idle: 1 }, orb: { size: 8, idle: 1 }, mine: { size: 8, idle: 1 }, boom: { size: 8, idle: 1 }, bomb: { size: 8, idle: 1 }, ice: { size: 8, idle: 1 }, vac: { size: 8, idle: 1 }, grass: { size: 8, idle: 1 }, seed: { size: 8, idle: 1 }, wood: { size: 8, idle: 1 }, sprout: { size: 8, idle: 1 }, crop: { size: 8, idle: 1 }, tree: { size: 16, idle: 1 }, rock: { size: 16, idle: 1 }, mush: { size: 16, idle: 1 } };
  for (const n of ['bat', 'ghoul', 'imp', 'brute', 'golem', 'wisp', 'bloat', 'minibloat', 'dasher', 'troll']) EXPECT[n] = { size: 16, walk: 2 };
  const fontBad = await pg.evaluate(() => { const S = window.TZS_SPRITES, bad = []; for (const k in S.FONT) { const r = S.FONT[k].split('/'); if (r.length !== 7 || r.some(x => x.length !== 5)) bad.push(k); if (S.glyphImg(k, '#fff').width !== 6) bad.push(k + ':bake'); } for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:!?-+%/()<>=') if (!S.FONT[ch]) bad.push('missing ' + ch); return bad; });
  if (fontBad.length) { console.log('font failed', fontBad); errs.push('font'); }
  const spr = await pg.evaluate((EXPECT) => {
    const S = window.TZS_SPRITES, bad = [];
    for (const n in EXPECT) if (!S.baked[n]) bad.push('missing ' + n);
    for (const n in S.baked) {
      const s = S.baked[n], e = EXPECT[n];
      if (!e) { bad.push('unexpected sprite ' + n); continue; }
      if (s.size !== e.size) bad.push(n + ' size ' + s.size);
      for (const a in s.anims) {
        const an = s.anims[a];
        if (an.frames.length !== e[a]) bad.push(n + '.' + a + ' frames ' + an.frames.length);
        for (const list of [an.frames, an.flip, an.flash]) for (const c of list) if (c.width !== e.size || c.height !== e.size) bad.push(n + '.' + a + ' canvas ' + c.width + 'x' + c.height);
      }
    }
    return bad;
  }, EXPECT);
  if (spr.length) { console.log('sprites failed', JSON.stringify(spr)); errs.push('sprites'); }
  // level-up reroll: one free per run, R swaps the cards, none left means no change; each Luck level adds one
  const rr = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G;
    const start = G.rerolls;
    t.state = 'levelup'; G.choices = [{ kind: 'p', k: 'might', lvl: 1 }];
    const before = G.choices; t.press('r');
    const swapped = G.choices !== before && G.choices.length === 3, after = G.rerolls;
    const held = G.choices; t.press('r');
    const unchanged = G.choices === held && G.rerolls === 0 && t.state === 'levelup';
    G.choices = [{ kind: 'p', k: 'luck', lvl: 1 }]; t.press('1');
    return { start, swapped, after, unchanged, luck: G.rerolls };
  });
  if (rr.start !== 1 || !rr.swapped || rr.after !== 0 || !rr.unchanged || rr.luck !== 1) { console.log('reroll failed', JSON.stringify(rr)); errs.push('reroll'); }
  // first level-up offers three distinct unowned weapons
  const fp = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.p.lvl = 2;
    const c = t.rollChoices(); return { n: c.length, ok: c.every(x => x.kind === 'w' && !G.w[x.k]), uniq: new Set(c.map(x => x.k)).size };
  });
  if (fp.n !== 3 || !fp.ok || fp.uniq !== 3) { console.log('first levelup failed', JSON.stringify(fp)); errs.push('firstlevelup'); }
  // level-up cards: every weapon and passive description fits the 300px card in at most two lines at 2x
  // (a longer one would drop to the tiny 1x font)
  const cardBad = await pg.evaluate(() => {
    const t = window.__tzs, bad = [];
    for (const d of [...Object.values(t.WEAPONS), ...Object.values(t.PASSIVES)]) if (t.wrapLines(d.desc, 280, 2).length > 2) bad.push(d.name);
    return bad;
  });
  if (cardBad.length) { console.log('card text failed', cardBad); errs.push('cards'); }
  // hit feedback: default knockback pushes non-bosses away from the player; bosses hold; lethal hits pop extra particles
  const hf = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.parts.length = 0;
    const mk = (boss) => ({ x: G.p.x + 100, y: G.p.y, r: 12, hp: 100, maxHp: 100, speed: 0, dmg: 5, xp: 1, color: '#fff', flash: 0, kind: 'ghoul', boss });
    const a = mk(false), b = mk(true); t.damage(a, 1); t.damage(b, 1);
    G.parts.length = 0; const c = mk(false); c.hp = 1; t.damage(c, 50); const pop = G.parts.length;
    return { da: a.x - (G.p.x + 100), db: b.x - (G.p.x + 100), pop };
  });
  if (!(hf.da > 3) || hf.db !== 0 || hf.pop < 8) { console.log('hit feedback failed', JSON.stringify(hf)); errs.push('hitfx'); }
  // best build memory: a new best run stores its weapon list for the end screen
  const bbm = await pg.evaluate(() => {
    const t = window.__tzs; localStorage.setItem('tzs_best', '5'); localStorage.removeItem('tzs_bestbuild'); t.start(); const G = t.G;
    G.t = 30; G.p.hp = 0; t.update(0.016); t.render(); const stored = localStorage.getItem('tzs_bestbuild');
    t.start(); t.G.t = 10; t.G.p.hp = 0; t.update(0.016); t.render();
    return { stored, newBest: t.G.newBest };
  });
  if (!bbm.stored || bbm.newBest) { console.log('best build failed', JSON.stringify(bbm)); errs.push('bestbuild'); }
  // hit feedback 2: heavy hits (elite/boss/30+) get big gold numbers; killing an elite sets a hit-stop
  const hf2 = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.texts.length = 0; G.hitstop = 0;
    const mk = (o) => Object.assign({ x: G.p.x + 100, y: G.p.y, r: 12, hp: 100, maxHp: 100, speed: 0, dmg: 5, xp: 1, color: '#fff', flash: 0, kind: 'ghoul' }, o);
    t.damage(mk({}), 1); const small = G.texts[G.texts.length - 1].big;
    t.damage(mk({}), 40); const heavy = G.texts[G.texts.length - 1].big;
    t.damage(mk({ elite: true, hp: 1 }), 5);
    return { small, heavy, stop: G.hitstop };
  });
  if (hf2.small || !hf2.heavy || !(hf2.stop > 0)) { console.log('hit feedback 2 failed', JSON.stringify(hf2)); errs.push('hitfx2'); }
  // pacing: spawn rate spikes at 5:00, then eases (relief) before ramping again; banner announces the surge
  const pc = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; const at = (s) => { G.t = s; return t.spawnRate(); };
    const before = at(299), spike = at(305), relief = at(345), later = at(400);
    G.t = 299.99; G.enemies.length = 0; G.p.hp = G.p.maxHp = 1e9; t.update(0.02);
    return { before, spike, relief, later, banner: G.bannerText };
  });
  if (!(pc.spike > pc.before * 1.4) || !(pc.relief < pc.before) || !(pc.later > pc.relief) || pc.banner !== 'THE SURGE!') { console.log('pacing failed', JSON.stringify(pc)); errs.push('pacing'); }
  // difficulty pass 2: wraith unlocks at 5:00; titan climax boss at 9:00 telegraphs a slam, then hits
  const cl = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.p.hp = G.p.maxHp = 1e9;
    G.t = 299; G.enemies.length = 0; for (let i = 0; i < 300; i++) t.spawnEnemy(false); const early = G.enemies.some(e => e.kind === 'wraith');
    G.t = 301; G.enemies.length = 0; for (let i = 0; i < 400; i++) t.spawnEnemy(false); const late = G.enemies.some(e => e.kind === 'wraith');
    t.start(); const H = t.G; H.p.hp = H.p.maxHp = 1e9; H.t = 539.99; H.nextBoss = 1e9; H.enemies.length = 0; t.update(0.02);
    const ti = H.enemies.find(e => e.titan); if (!ti) return { early, late, titan: false };
    ti.x = H.p.x + 2000; ti.y = H.p.y; ti.st = 0; t.update(0.02); const warned = !!ti.slam; t.render();
    ti.slam.t = 0.01; ti.slam.x = H.p.x; ti.slam.y = H.p.y; H.p.hurt = 0; const hp0 = H.p.hp; t.update(0.05);
    return { early, late, titan: true, warned, hit: H.p.hp < hp0, cleared: !ti.slam };
  });
  if (cl.early || !cl.late || !cl.titan || !cl.warned || !cl.hit || !cl.cleared) { console.log('climax failed', JSON.stringify(cl)); errs.push('climax'); }
  // sprite-sheet review page renders without errors
  const sheetErrs = [];
  const sp = await b.newPage({ viewport: { width: 390, height: 844 } });
  sp.on('pageerror', e => sheetErrs.push(e.message));
  await sp.goto('file://' + path.resolve(__dirname, '../index.html') + '?sprites=1');
  await sp.waitForTimeout(200);
  if (sheetErrs.length) { console.log('sprite sheet failed', JSON.stringify(sheetErrs)); errs.push('sheet'); }
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
