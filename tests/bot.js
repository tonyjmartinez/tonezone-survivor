// Balance probe: node tests/bot.js  -- a kiting bot (flees nearest enemies, picks level-ups) over several seeds.
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
      for (let i = 0; i < 60 * 600 && t.state !== 'dead'; i++) {
        const p = t.G.p; let fx = 0, fy = 0;
        for (const e of t.G.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < 200) { fx += (p.x - e.x) / (d * d + 1); fy += (p.y - e.y) / (d * d + 1); } }
        if (!fx && !fy) { let bd = 1e9, g0 = null; for (const g of t.G.gems) { const d = Math.hypot(p.x - g.x, p.y - g.y); if (d < bd) { bd = d; g0 = g; } } if (g0) { fx = g0.x - p.x; fy = g0.y - p.y; } }
        const m = Math.hypot(fx, fy) || 1; p.x += fx / m * p.speed / 60; p.y += fy / m * p.speed / 60;
        t.update(1 / 60); if (t.state === 'levelup') t.press('1');
      }
      out.push({ t: Math.round(t.G.t), lvl: t.G.p.lvl, kills: t.G.kills });
    }
    return out;
  });
  console.log(JSON.stringify(res));
  await b.close();
})();
