// Balance probe: kiting bot. node tests/bot.js [runs]  (needs playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const runs = +process.argv[2] || 5;
  const out = await pg.evaluate(runs => {
    const t = window.__tzs, res = [];
    for (let r = 0; r < runs; r++) {
      t.start(); const p = t.G.p;
      for (let i = 0; i < 60 * 600; i++) {
        // flee: sum of inverse-distance vectors from nearby enemies
        let fx = 0, fy = 0;
        for (const e of t.G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d < 220) { fx += dx / d / d * 100; fy += dy / d / d * 100; } }
        const m = Math.hypot(fx, fy) || 1; p.x += fx / m * p.speed / 60 * (m > 0.01 ? 1 : 0); p.y += fy / m * p.speed / 60 * (m > 0.01 ? 1 : 0);
        t.update(1 / 60);
        if (t.state === 'levelup') t.press(String(1 + Math.floor(Math.random() * 3)));
        if (t.state === 'dead') break;
      }
      res.push({ time: Math.round(t.G.t), lvl: p.lvl, kills: t.G.kills });
    }
    return res;
  }, runs);
  console.log(JSON.stringify(out));
  await b.close();
})();
