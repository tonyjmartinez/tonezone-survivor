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
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
