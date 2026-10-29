// Asserts smoke.js fails fast with exit 2 and a clear message when its prerequisites are missing.
// Needs no browser or playwright.
// Run: node tests/preflight.js
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const smoke = path.join(__dirname, 'smoke.js');
// a regular file without the execute bit must be rejected by the preflight, not passed on to launch
const nonExec = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tzs-pf-')), 'chrome');
fs.writeFileSync(nonExec, '#!/bin/sh\n', { mode: 0o644 });
const cases = [
  { name: 'missing browser', env: { CHROMIUM: '/nonexistent-tzs/chrome' }, want: 'no browser at' },
  { name: 'non-executable browser file', env: { CHROMIUM: nonExec }, want: 'no browser at' },
];
let failed = 0;
for (const c of cases) {
  const r = spawnSync(process.execPath, [smoke], { env: { ...process.env, ...c.env }, encoding: 'utf8' });
  const ok = r.status === 2 && (r.stderr || '').includes(c.want);
  if (!ok) { failed++; console.log('preflight FAIL', c.name, r.status, r.stderr); } else console.log('preflight ok:', c.name);
}
process.exit(failed ? 1 : 0);
