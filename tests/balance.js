// Balance probe: node tests/balance.js  — simulates idle + kiting bots, prints survival time (median of runs).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const res = await pg.evaluate(() => {
    const t = window.__tzs, out = {};
    for (const bot of ['idle', 'kite']) {
      const times = [];
      for (let run = 0; run < 7; run++) {
        t.start();
        for (let i = 0; i < 60 * 60 * 15; i++) {
          const G = t.G, p = G.p;
          if (bot === 'kite') {
            let fx = 0, fy = 0;
            for (const e of G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 220 * 220) { fx += dx / (d2 + 1); fy += dy / (d2 + 1); } }
            const k = t.keys; k['d'] = fx > 1e-4; k['a'] = fx < -1e-4; k['s'] = fy > 1e-4; k['w'] = fy < -1e-4;
          }
          t.update(1 / 60);
          if (t.state === 'levelup') t.press('1');
          if (t.state === 'dead') break;
        }
        times.push(Math.round(t.G.t));
      }
      times.sort((a, c) => a - c); out[bot] = { median: times[3], all: times };
    }
    return out;
  });
  console.log(JSON.stringify(res));
  await b.close();
})();
