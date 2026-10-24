// Balance probe: node tests/bot.js — a kiting bot plays N runs; prints survival times.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate(() => {
    const out = [];
    for (let run = 0; run < 5; run++) {
      const t = window.__tzs; t.start();
      for (let i = 0; i < 60 * 600; i++) {
        const G = t.G, p = G.p; let fx = 0, fy = 0;
        for (const e of G.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < 220) { fx += (p.x - e.x) / (d * d + 1); fy += (p.y - e.y) / (d * d + 1); } }
        const m = Math.hypot(fx, fy) || 1; p.x += fx / m * p.speed / 60 * 0.9; p.y += fy / m * p.speed / 60 * 0.9;
        t.update(1 / 60); if (t.state === 'levelup') t.press(String(1 + (i % 3))); if (t.state === 'dead') break;
      }
      out.push(Math.round(t.G.t));
    }
    return out;
  });
  console.log('bot survival secs:', r.join(', '));
  await b.close();
})();
