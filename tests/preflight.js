// Asserts smoke.js fails fast with exit 2 and a clear message when its prerequisites are missing.
// Run: node tests/preflight.js  (no browser needed)
const { spawnSync } = require('child_process');
const path = require('path');
const smoke = path.join(__dirname, 'smoke.js');
const cases = [
  { name: 'missing playwright', env: { NODE_PATH: '/nonexistent-tzs', CHROMIUM: '/nonexistent-tzs/chrome' }, want: "cannot load 'playwright'" },
];
// the browser case needs a resolvable playwright; skip it (not fail) when none is installed
let pwDir = null;
try { pwDir = path.dirname(path.dirname(require.resolve('playwright', { paths: [process.env.NODE_PATH || __dirname] }))); } catch (e) {}
if (pwDir) cases.push({ name: 'missing browser', env: { NODE_PATH: pwDir, CHROMIUM: '/nonexistent-tzs/chrome' }, want: 'no browser at' });
else console.log('preflight skip: missing browser (no playwright resolvable)');
let failed = 0;
for (const c of cases) {
  let r;
  try { r = spawnSync(process.execPath, [smoke], { env: { ...process.env, ...c.env }, encoding: 'utf8' }); } catch (e) { r = { status: -1, stderr: String(e) }; }
  const ok = r.status === 2 && (r.stderr || '').includes(c.want);
  if (!ok) { failed++; console.log('preflight FAIL', c.name, r.status, r.stderr); } else console.log('preflight ok:', c.name);
}
process.exit(failed ? 1 : 0);
