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
      t.start(); const G = t.G, p = G.p;
      for (let i = 0; i < 60 * 60 * 12; i++) {
        // flee: weighted away-vector from nearby enemies
        let fx = 0, fy = 0;
        for (const e of G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 220) { fx += dx / d / d * 100; fy += dy / d / d * 100; } }
        if (!fx && !fy) { let g = null, bd = 1e12; for (const q of G.gems) { const d = (q.x-p.x)**2+(q.y-p.y)**2; if (d < bd) { bd = d; g = q; } } if (g) { fx = g.x - p.x; fy = g.y - p.y; } }
        const m = Math.hypot(fx, fy) || 1; p.x += fx / m * p.speed / 60 * (m > 0.01 ? 1 : 0); p.y += fy / m * p.speed / 60 * (m > 0.01 ? 1 : 0);
        t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break;
      }
      out.push({ t: Math.round(G.t), lvl: p.lvl, kills: G.kills });
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
