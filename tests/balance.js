// Balance sim: node tests/balance.js  — a simple kiting bot plays N runs headlessly; prints survival times.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate((runs) => {
    const t = window.__tzs, out = [];
    for (let n = 0; n < runs; n++) {
      t.start();
      for (let i = 0; i < 60 * 600; i++) {
        const G = t.G, p = G.p;
        // bot: flee the centroid of nearby enemies, else drift toward gems
        let fx = 0, fy = 0;
        for (const e of G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 220 * 220) { const d = Math.sqrt(d2) || 1; fx += dx / d / (d + 20) * 100; fy += dy / d / (d + 20) * 100; } }
        let best = null, bd = 1e9; for (const g of G.gems) { const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2; if (d < bd) { bd = d; best = g; } }
        if (best && bd < 300 * 300) { const d = Math.sqrt(bd) || 1; fx += (best.x - p.x) / d * 0.4; fy += (best.y - p.y) / d * 0.4; }
        t.setMove(fx, fy);
        t.update(1 / 60);
        if (t.state === 'levelup') t.press(String(1 + (i % 3)));
        if (t.state === 'dead') break;
      }
      out.push({ time: +t.G.t.toFixed(1), lvl: t.G.p.lvl, kills: t.G.kills });
    }
    return out;
  }, +process.argv[2] || 5);
  console.log(JSON.stringify(r));
  const avg = r.reduce((a, x) => a + x.time, 0) / r.length;
  console.log('avg survival (s):', avg.toFixed(1));
  await b.close();
})();
