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
    const idle = { time: t.G.t, kills: t.G.kills };
    // kiting bot: balance probe (5 min cap)
    t.start();
    for (let i = 0; i < 60 * 300; i++) {
      const G = t.G, p = G.p; let ax = 0, ay = 0;
      for (const e of G.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < 220) { ax += (p.x - e.x) / (d * d + 1); ay += (p.y - e.y) / (d * d + 1); } }
      const m = Math.hypot(ax, ay) || 1; p.x += ax / m * p.speed / 60; p.y += ay / m * p.speed / 60;
      t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break;
    }
    const bot = { time: Math.round(t.G.t), kills: t.G.kills, lvl: t.G.p.lvl };
    t.start();
    t.press('p');
    return { idle, bot, pauseOk: t.state === 'pause' };
  });
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.idle.kills < 1 || !r.pauseOk) process.exit(1);
})();
