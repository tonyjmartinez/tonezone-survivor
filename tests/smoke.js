// Headless smoke test: node tests/smoke.js  (needs playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  const r = await pg.evaluate(() => {
    const t = window.__tzs; t.start();
    // kiting bot: flee the enemy centroid within 250px, via synthetic key events
    const held = {};
    const set = (k, on) => { if (!!held[k] !== on) { held[k] = on; dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { key: k })); } };
    const bot = () => {
      let ax = 0, ay = 0; const p = t.G.p;
      for (const e of t.G.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 250) { ax += dx / d / d; ay += dy / d / d; } }
      set('d', ax > 1e-4); set('a', ax < -1e-4); set('s', ay > 1e-4); set('w', ay < -1e-4);
    };
    for (let i = 0; i < 60 * 180; i++) { if (i % 6 === 0) bot(); t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break; }
    t.render();
    return { state: t.state, time: t.G.t, kills: t.G.kills, lvl: t.G.p.lvl, hp: t.G.p.hp, enemies: t.G.enemies.length };
  });
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
