// Balance probe: node tests/balance.js  — a simple kiting bot plays N runs, prints survival times.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate(() => {
    const t = window.__tzs, out = [];
    for (let run = 0; run < 5; run++) {
      t.start();
      for (let i = 0; i < 60 * 60 * 15 && t.state !== 'dead'; i++) {
        const G = t.G, p = G.p; let fx = 0, fy = 0;
        for (const e of G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 220) { fx += dx / d / d * 100; fy += dy / d / d * 100; } }
        if (!fx && !fy) { let bd = 1e9, bg; for (const g of G.gems) { const d = (g.x-p.x)**2+(g.y-p.y)**2; if (d < bd) { bd = d; bg = g; } } if (bg) { fx = bg.x - p.x; fy = bg.y - p.y; } }
        const k = t.keys; k.d = fx > 0.02; k.a = fx < -0.02; k.s = fy > 0.02; k.w = fy < -0.02;
        t.update(1 / 60); if (t.state === 'levelup') t.press('1');
      }
      out.push({ secs: Math.round(t.G.t), lvl: t.G.p.lvl, kills: t.G.kills });
    }
    return out;
  });
  console.log(JSON.stringify(r)); await b.close();
})();
