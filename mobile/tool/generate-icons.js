// Render the original game's sprite into mobile launcher icons.
// Uses the same Playwright installation as the repository smoke tests.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(root, 'assets/game/index.html'));
    const targets = [ ['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192] ].map(([density, size]) => ({ size, file: `android/app/src/main/res/mipmap-${density}/ic_launcher.png` }));
    const ios = 'ios/Runner/Assets.xcassets/AppIcon.appiconset';
    for (const image of JSON.parse(fs.readFileSync(path.join(root, ios, 'Contents.json'))).images) {
      targets.push({ size: parseFloat(image.size) * parseFloat(image.scale), file: `${ios}/${image.filename}` });
    }
    for (const {size, file} of targets) {
      const data = await page.evaluate(size => {
        const cv = document.createElement('canvas'); cv.width = cv.height = size;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#0b1214'; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#20372a'; ctx.fillRect(size * .12, size * .12, size * .76, size * .76);
        ctx.strokeStyle = '#e6c36a'; ctx.lineWidth = Math.max(1, size * .025); ctx.strokeRect(size * .13, size * .13, size * .74, size * .74);
        ctx.imageSmoothingEnabled = false;
        TZS_SPRITES.drawSprite(ctx, TZS_SPRITES.variant('player', '#e6c36a'), 'idle', 0, size / 2, size * .53, size * .038);
        return cv.toDataURL('image/png').split(',')[1];
      }, size);
      fs.writeFileSync(path.join(root, file), Buffer.from(data, 'base64'));
    }
    console.log(`Rendered ${targets.length} Android/iOS icons from original game art.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
