// Balance probe: node tests/balance.js  — a kiting bot plays N runs; prints survival times.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate((N) => {
    const out = [], t = window.__tzs;
    for (let n = 0; n < N; n++) {
      t.start();
      for (let i = 0; i < 60 * 900; i++) {
        const { p, enemies } = t.G;
        // bot: flee the weighted centroid of close enemies
        let fx = 0, fy = 0;
        for (const e of enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 220) { fx += dx / d / d * 100; fy += dy / d / d * 100; } }
        t.setMove(fx, fy);
        t.update(1 / 60);
        if (t.state === 'levelup') t.press('1');
        if (t.state === 'dead') break;
      }
      out.push(Math.round(t.G.t));
    }
    return out;
  }, +process.argv[2] || 6);
  console.log('survival seconds:', r.join(' '));
  await b.close();
})();
