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
    for (let i = 0; i < 60 * 60; i++) { t.update(1 / 60); if (t.state === 'levelup') t.press('1'); if (t.state === 'dead') break; }
    t.render();
    const smoke = { state: t.state, time: t.G.t, kills: t.G.kills, lvl: t.G.p.lvl, hp: t.G.p.hp, enemies: t.G.enemies.length };
    // kiting bot (balance probe): flees nearest enemy, up to 10 sim minutes
    t.start();
    for (let i = 0; i < 60 * 600 && t.state !== 'dead'; i++) {
      const p = t.G.p; let n = null, bd = 1e12;
      for (const e of t.G.enemies) { const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (d < bd) { bd = d; n = e; } }
      t.keys.a = t.keys.d = t.keys.w = t.keys.s = false;
      if (n && bd < 200 * 200) { t.keys[n.x > p.x ? 'a' : 'd'] = true; t.keys[n.y > p.y ? 'w' : 's'] = true; }
      t.update(1 / 60); if (t.state === 'levelup') t.press('1');
    }
    smoke.botSurvived = Math.round(t.G.t); smoke.botLvl = t.G.p.lvl;
    return smoke;
  });
  console.log(JSON.stringify(r), errs);
  await b.close();
  if (errs.length || r.kills < 1) process.exit(1);
})();
