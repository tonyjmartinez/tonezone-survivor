// Headless smoke test: node tests/smoke.js  (needs playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
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
  const mn = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.w.mine = 1;
    t.update(0.02); const placed = G.mines.length; G.mines[0].age = 1;
    const e = { x: G.mines[0].x + 5, y: G.mines[0].y, r: 10, hp: 500, maxHp: 500, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' };
    G.enemies.push(e); t.update(0.02); t.render();
    return { placed, hp: e.hp, left: G.mines.length };
  });
  if (mn.placed !== 1 || mn.hp >= 500) { console.log('mine failed', JSON.stringify(mn)); errs.push('mine'); }
  // enemy ground shadows: only enemies near the view get a drawImage (the game's only drawImage call); far ones are culled
  const sh = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const G = t.G; G.enemies.length = 0; G.w.mine = 0;
    const cx = G.cam.x + 450, cy = G.cam.y + 300;
    for (let i = 0; i < 40; i++) G.enemies.push({ x: cx + (i % 8) * 50 - 175, y: cy + ((i / 8) | 0) * 50 - 100, r: 12, hp: 999, maxHp: 999, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' });
    for (let i = 0; i < 40; i++) G.enemies.push({ x: cx + 3000 + i * 10, y: cy, r: 12, hp: 999, maxHp: 999, speed: 0, dmg: 0, xp: 1, color: '#fff', flash: 0, kind: 'bat' });
    const C = CanvasRenderingContext2D.prototype, orig = C.drawImage; let n = 0;
    C.drawImage = function (...a) { if (a[0] && a[0].width === 32) n++; return orig.apply(this, a); };
    try { t.render(); } finally { C.drawImage = orig; }
    return { onscreen: 40, drawn: n };
  });
  if (sh.drawn !== sh.onscreen) { console.log('shadow cull failed', JSON.stringify(sh)); errs.push('shadow-cull'); }
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
