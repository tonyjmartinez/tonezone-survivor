// Balance sim: node tests/balance.js  — a kiting bot plays N runs; prints survival times.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const res = await pg.evaluate(() => {
    const t = window.__tzs, out = [];
    for (let run = 0; run < 5; run++) {
      t.start();
      for (let i = 0; i < 60 * 60 * 12 && t.state !== 'dead'; i++) {
        const G = t.G, p = G.p; let fx = 0, fy = 0;
        for (const e of G.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < 220) { fx += (p.x - e.x) / (d * d + 1) * 100; fy += (p.y - e.y) / (d * d + 1) * 100; } }
        for (const h of G.hearts) if (p.hp < p.maxHp * 0.7) { fx += (h.x - p.x) * 0.01; fy += (h.y - p.y) * 0.01; }
        fx += Math.cos(G.t * 0.3) * 0.15; fy += Math.sin(G.t * 0.3) * 0.15; // wander
        t.keys['d'] = fx > 0.1; t.keys['a'] = fx < -0.1; t.keys['s'] = fy > 0.1; t.keys['w'] = fy < -0.1;
        t.update(1 / 60); if (t.state === 'levelup') t.press('1');
      }
      out.push({ t: Math.round(t.G.t), lvl: t.G.p.lvl, kills: t.G.kills });
    }
    return out;
  });
  console.log(JSON.stringify(res));
  await b.close();
})();
