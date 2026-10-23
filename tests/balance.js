// Balance probe: node tests/balance.js  — simple bot (kite away from nearby enemies, else chase gems/hearts).
// Prints survival time per run. Not a pass/fail test; use to tune difficulty.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const res = await pg.evaluate((runs) => {
    const t = window.__tzs, out = [];
    for (let r = 0; r < runs; r++) {
      t.start();
      const k = window.__keys;
      for (let i = 0; i < 60 * 60 * 10; i++) {
        const G = t.G, p = G.p; let fx = 0, fy = 0;
        for (const e of G.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < 160) { fx += (p.x - e.x) / d * (160 - d); fy += (p.y - e.y) / d * (160 - d); } }
        if (!fx && !fy) { let bd = 1e9, tg = null; for (const g of G.gems.concat(G.hearts)) { const d = Math.hypot(p.x - g.x, p.y - g.y); if (d < bd) { bd = d; tg = g; } } if (tg) { fx = tg.x - p.x; fy = tg.y - p.y; } }
        t.steer(fx, fy);
        t.update(1 / 60);
        if (t.state === 'levelup') t.press(String(1 + Math.floor(Math.random() * 3)));
        if (t.state === 'dead') break;
      }
      out.push({ time: Math.round(t.G.t), lvl: t.G.p.lvl, kills: t.G.kills });
    }
    return out;
  }, +(process.argv[2] || 5));
  console.log(res.map(r => `${r.time}s lvl${r.lvl} kills${r.kills}`).join('\n'));
  console.log('avg survival', Math.round(res.reduce((a, r) => a + r.time, 0) / res.length) + 's');
  await b.close();
})();
