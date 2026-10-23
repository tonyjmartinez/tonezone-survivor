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
  // bot run: flees the enemy centroid; reports survival time (balance indicator, not a pass/fail gate)
  const bot = await pg.evaluate(() => {
    const t = window.__tzs; t.start(); const p = t.G.p;
    for (let i = 0; i < 60 * 600; i++) {
      let cx = 0, cy = 0, n = 0;
      for (const e of t.G.enemies) if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 300 * 300) { cx += e.x; cy += e.y; n++; }
      if (n) { const a = Math.atan2(p.y - cy / n, p.x - cx / n); p.x += Math.cos(a) * p.speed / 60; p.y += Math.sin(a) * p.speed / 60; }
      t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break;
    }
    return { state: t.state, time: Math.round(t.G.t), kills: t.G.kills, lvl: t.G.p.lvl };
  });
  console.log('bot', JSON.stringify(bot));
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
