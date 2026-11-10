// The same touch flow runs against canonical web source and the offline mobile bundle.
const assert = require('node:assert/strict');
const path = require('node:path');
const { check } = require('../tools/package-game.cjs');
const { chromium } = require('playwright');
(async () => {
  const manifest = check();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || chromium.executablePath() });
  try {
    for (const entry of ['../index.html', '../mobile/assets/game/index.html']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const errors = [], remote = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
      await page.goto('file://' + path.resolve(__dirname, entry));
      await page.waitForFunction(() => window.__tzs && typeof __tzs.titleLayout === 'function');
      const tap = async expression => {
        const point = await page.evaluate(source => {
          const r = (0, eval)(source); return { x: r.w ? r.x + r.w / 2 : r.x, y: r.h ? r.y + r.h / 2 : r.y };
        }, expression);
        await page.touchscreen.tap(point.x, point.y);
      };
      await tap('__tzs.titleLayout().right');
      assert.equal(await page.evaluate(() => __tzs.charIdx), 1);
      await tap('__tzs.titleLayout().left');
      await tap('__tzs.titleLayout().hard');
      assert.equal(await page.evaluate(() => __tzs.hard), true);
      await tap('__tzs.titleLayout().hard');
      await tap('__tzs.titleLayout().start');
      await page.waitForFunction(() => __tzs.G.t > .3);
      await tap('__tzs.dashBtn()');
      assert.equal(await page.evaluate(() => __tzs.G.p.dashCd > 0), true);
      // Give one seed to isolate the PLANT hit target from random drops.
      await page.evaluate(() => { __tzs.G.seeds = 1; });
      await tap('__tzs.plantBtn()');
      assert.equal(await page.evaluate(() => __tzs.G.crops.length), 1);
      await tap('__tzs.pauseBtn()');
      assert.equal(await page.evaluate(() => __tzs.state), 'pause');
      await tap('__tzs.pauseRects().resume');
      await page.evaluate(() => { __tzs.G.p.xp = __tzs.G.p.need; __tzs.update(.016); });
      assert.equal(await page.evaluate(() => __tzs.state), 'levelup');
      // Respect the shared game's accidental-tap guard while cards animate in.
      await page.waitForFunction(() => __tzs.G.lvlT >= .4);
      await tap('__tzs.choiceRects()[0]');
      assert.equal(await page.evaluate(() => __tzs.state), 'play');
      await tap('__tzs.pauseBtn()');
      await tap('__tzs.pauseRects().menu');
      assert.equal(await page.evaluate(() => __tzs.state), 'title');
      await page.reload();
      await page.waitForFunction(() => window.__tzs);
      assert.deepEqual(errors, []); assert.deepEqual(remote, []);
      console.log(`${entry}: shared title/start/dash/plant/pause/upgrades/menu/reload pass; offline; hash ${manifest.contentSha256.slice(0, 12)}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
