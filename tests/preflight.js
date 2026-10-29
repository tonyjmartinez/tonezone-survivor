// Asserts smoke.js fails fast with exit 2 and a clear message when its prerequisites are missing.
// Needs no browser or playwright: missing playwright is simulated via TZS_SMOKE_FORCE_NO_PLAYWRIGHT=1.
// Run: node tests/preflight.js
const { spawnSync } = require('child_process');
const path = require('path');
const smoke = path.join(__dirname, 'smoke.js');
const cases = [
  { name: 'missing browser', env: { CHROMIUM: '/nonexistent-tzs/chrome', PW_CHROMIUM: '' }, want: 'no browser at' },
  { name: 'missing playwright', env: { TZS_SMOKE_FORCE_NO_PLAYWRIGHT: '1' }, want: "cannot load 'playwright'" },
];
let failed = 0;
for (const c of cases) {
  const r = spawnSync(process.execPath, [smoke], { env: { ...process.env, ...c.env }, encoding: 'utf8' });
  const ok = r.status === 2 && (r.stderr || '').includes(c.want);
  if (!ok) { failed++; console.log('preflight FAIL', c.name, r.status, r.stderr); } else console.log('preflight ok:', c.name);
}
process.exit(failed ? 1 : 0);
