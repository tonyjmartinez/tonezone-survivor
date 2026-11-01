// Run with the same NODE_PATH and CHROMIUM as tests/smoke.js.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  for (const file of ['game.js', 'sprites.js']) {
    assert.equal(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), fs.readFileSync(path.join(__dirname, '../mobile/assets/game/src', file), 'utf8'));
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const requests = []; page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    await page.goto('file://' + path.resolve(__dirname, '../mobile/assets/game/index.html'));
    await page.waitForFunction(() => window.TonezoneMobile);
    await page.locator('#next').tap();
    assert.equal(await page.locator('#character-name').textContent(), 'Knight');
    await page.locator('#previous').tap();
    await page.locator('#start').tap();
    await page.waitForFunction(() => __tzs.G.t > 0.5);
    await page.locator('#pause').tap();
    assert.equal(await page.evaluate(() => __tzs.state), 'pause');
    await page.locator('#resume').tap();
    assert.equal(await page.evaluate(() => __tzs.state), 'play');
    const dash = await page.evaluate(() => __tzs.dashBtn());
    await page.touchscreen.tap(dash.x, dash.y);
    assert.equal(await page.evaluate(() => __tzs.G.p.dashCd > 0), true);
    await page.evaluate(() => { __tzs.G.p.xp = __tzs.G.p.need; __tzs.update(.016); });
    assert.equal(await page.evaluate(() => __tzs.state), 'levelup');
    await page.touchscreen.tap(190, 344);
    assert.equal(await page.evaluate(() => __tzs.state), 'play');
    await page.evaluate(() => TonezoneMobile.pause());
    await page.locator('#menu').tap();
    assert.equal(await page.evaluate(() => __tzs.state), 'title');
    await page.reload();
    await page.waitForFunction(() => window.TonezoneMobile);
    await page.waitForTimeout(400);
    assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    console.log('Mobile: touch selection/start/pause/resume/dash/level-up/menu/reload; original engine identical; no network requests; no JS errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
