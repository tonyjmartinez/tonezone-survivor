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
  if (dash.dx < 20 || dash.cd <= 0) { console.log('dash failed', JSON.stringify(dash)); errs.push('dash'); }
  const sum = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); t.G.w.bolt = 8; t.G.pa.haste = 2; return t.buildSummary();
  });
  if (!/\(EVO\)/.test(sum.wl) || !/ 2$/.test(sum.pl)) { console.log('summary failed', JSON.stringify(sum)); errs.push('summary'); }
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
  const EXPECT = { player: { size: 16, idle: 2, walk: 4 }, boss: { size: 32, walk: 2 }, gem: { size: 8, idle: 1 }, heart: { size: 8, idle: 1 }, chest: { size: 8, idle: 1 }, bolt: { size: 8, idle: 1 }, orb: { size: 8, idle: 1 }, mine: { size: 8, idle: 1 }, boom: { size: 8, idle: 1 }, bomb: { size: 8, idle: 1 }, ice: { size: 8, idle: 1 }, vac: { size: 8, idle: 1 }, tree: { size: 16, idle: 1 }, rock: { size: 16, idle: 1 }, mush: { size: 16, idle: 1 } };
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
