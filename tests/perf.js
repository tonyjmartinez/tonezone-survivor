// Crowded-scene perf probe (docs/ART.md slice 8): average update/render ms per frame with 100, 300 and 600
// enemies at a 390px viewport, at normal speed and with the CPU throttled 4x (a rough phone stand-in).
// Not a pass/fail test: headless Chromium draws in software, so treat the numbers as relative.
// Run: CHROMIUM=/path/to/chrome NODE_PATH=$(npm root -g) node tests/perf.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const throttle of [1, 4]) {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
    const cdp = await pg.context().newCDPSession(pg);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
    const r = await pg.evaluate(() => {
      const t = window.__tzs, out = {};
      for (const n of [100, 300, 600]) {
        t.start(); const G = t.G; G.p.hp = G.p.maxHp = 1e9;
        for (const k of ['orbit', 'garlic', 'boomer', 'zap', 'mine', 'frost', 'whip', 'nova']) G.w[k] = 3;
        for (let i = 0; i < 120; i++) { t.update(1 / 60); if (t.state === 'levelup') t.press('1'); }
        const kinds = ['bat', 'ghoul', 'imp', 'brute', 'golem', 'wisp'];
        while (G.enemies.length < n) {
          const a = Math.random() * 7, d = 60 + Math.random() * 500;
          G.enemies.push({ x: G.p.x + Math.cos(a) * d, y: G.p.y + Math.sin(a) * d, r: 12, hp: 1e9, maxHp: 1e9, speed: 40, dmg: 1, xp: 1, color: '#fff', flash: 0, kind: kinds[G.enemies.length % 6] });
        }
        t.render(); // warm caches (glyphs, tinted sprite variants) outside the timed frames
        let up = 0, rd = 0, worst = 0; const frames = 120;
        for (let i = 0; i < frames; i++) {
          const a = performance.now(); t.update(1 / 60); const m = performance.now(); t.render(); const z = performance.now();
          up += m - a; rd += z - m; worst = Math.max(worst, z - a);
          if (t.state === 'levelup') t.press('1');
        }
        out[n] = { updateMs: +(up / frames).toFixed(2), renderMs: +(rd / frames).toFixed(2), worstMs: +worst.toFixed(1) };
      }
      return out;
    });
    console.log(`cpu x${throttle}`, JSON.stringify(r));
    await pg.close();
  }
  await b.close();
})();
