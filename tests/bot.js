// Balance probe: kiting bot, prints survival time per run. node tests/bot.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const res = await pg.evaluate(() => {
    const out = [];
    for (let run = 0; run < 5; run++) {
      const t = window.__tzs; t.start();
      for (let i = 0; i < 60 * 600; i++) {
        const G = t.G, p = G.p; let fx = 0, fy = 0;
        for (const e of G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy + 1; if (d2 < 250 * 250) { fx += dx / d2; fy += dy / d2; } }
        for (const g of G.gems) { const dx = g.x - p.x, dy = g.y - p.y, d2 = dx * dx + dy * dy + 1; if (d2 < 200 * 200) { fx += dx / d2 * 0.02; fy += dy / d2 * 0.02; } }
        const k = t.keys; k.a = fx < -1e-5; k.d = fx > 1e-5; k.w = fy < -1e-5; k.s = fy > 1e-5;
        t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break;
      }
      out.push(Math.round(t.G.t));
    }
    return out;
  });
  console.log('survival secs:', res.join(', '));
  await b.close();
})();
