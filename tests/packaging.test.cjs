const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { prepare, check, destination } = require('../tools/package-game.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tonezone-packaging-'));
  // Verify the resolved fixture root remains in the intended temporary directory.
  assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'index.html'), '<canvas id="c"></canvas>\r\n');
  fs.writeFileSync(path.join(root, 'src/game.js'), 'window.game = 1;\r\n');
  fs.writeFileSync(path.join(root, 'src/sprite.png'), Buffer.from([0, 255, 13, 10, 42]));
  return root;
}
test('web and mobile ship identical canonical code and binary assets', t => {
  const root = fixture(t), web = prepare(root, 'web'), mobile = prepare(root, 'mobile');
  assert.deepEqual(web, mobile);
  for (const file of Object.keys(web.files)) {
    assert.deepEqual(fs.readFileSync(path.join(destination(root, 'web'), file)), fs.readFileSync(path.join(destination(root, 'mobile'), file)));
  }
  assert.equal(fs.readFileSync(path.join(destination(root, 'mobile'), 'src/game.js'), 'utf8'), 'window.game = 1;\n');
  assert.doesNotThrow(() => check(root));
});
test('a web source change cannot silently ship a stale mobile game', t => {
  const root = fixture(t); prepare(root);
  fs.writeFileSync(path.join(root, 'src/game.js'), 'window.game = 2;');
  assert.throws(() => check(root), /Stale mobile/);
  prepare(root); assert.doesNotThrow(() => check(root));
});
test('tampered or obsolete generated files are rejected and cleaned on prepare', t => {
  const root = fixture(t); prepare(root);
  fs.writeFileSync(path.join(destination(root, 'mobile'), 'src/game.js'), 'wrong game');
  assert.throws(() => check(root), /Stale mobile/);
  prepare(root);
  fs.writeFileSync(path.join(destination(root, 'mobile'), 'old-mobile-ui.js'), 'obsolete');
  assert.throws(() => check(root), /Stale mobile/);
  prepare(root); assert.doesNotThrow(() => check(root));
  assert.equal(fs.existsSync(path.join(destination(root, 'mobile'), 'old-mobile-ui.js')), false);
});
