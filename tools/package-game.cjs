// One source for web and offline mobile: index.html + src/**.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const MANIFEST = 'game-build.json';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function walk(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Game assets must not be symlinks: ${entry.name}`);
    const name = prefix + entry.name;
    return entry.isDirectory() ? walk(path.join(directory, entry.name), name + '/') : [name];
  });
}
function sourceFiles(root) {
  return ['index.html', ...walk(path.join(root, 'src'), 'src/')].sort();
}
function sourceBytes(root, file) {
  const bytes = fs.readFileSync(path.join(root, file));
  // Git checkouts can have CRLF on Windows and LF on Linux. Ship consistent text.
  return /\.(html|js|css|json|svg|txt)$/.test(file) ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
}
function snapshot(root) {
  const files = Object.fromEntries(sourceFiles(root).map(file => [file, sha(sourceBytes(root, file))]));
  let sourceCommit = null;
  try { sourceCommit = execFileSync('git', ['log', '-1', '--format=%H', '--', 'index.html', 'src'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null; } catch { /* source archives can build without Git */ }
  return { schemaVersion: 1, sourceCommit, contentSha256: sha(JSON.stringify(files)), files };
}
function destination(root, platform) {
  if (!['web', 'mobile'].includes(platform)) throw new Error(`Unknown platform: ${platform}`);
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, platform === 'web' ? 'dist' : 'mobile/assets/game');
  const expected = platform === 'web' ? 'dist' : path.join('mobile', 'assets', 'game');
  // Guard the exact absolute generated directory before any recursive removal.
  if (path.relative(absoluteRoot, target) !== expected) throw new Error('Unsafe generated asset path');
  for (let dir = target; dir !== absoluteRoot; dir = path.dirname(dir)) {
    if (fs.existsSync(dir) && fs.lstatSync(dir).isSymbolicLink()) throw new Error(`Refusing symlink output: ${dir}`);
  }
  return target;
}
function prepare(root = ROOT, platform = 'mobile') {
  const manifest = snapshot(root), target = destination(root, platform);
  // Read every source before touching the generated directory.
  const contents = Object.keys(manifest.files).map(file => [file, sourceBytes(root, file)]);
  fs.rmSync(target, { recursive: true, force: true });
  for (const [file, bytes] of contents) {
    const output = path.join(target, file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, bytes);
  }
  fs.writeFileSync(path.join(target, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
function check(root = ROOT, platform = 'mobile') {
  const target = destination(root, platform), expected = snapshot(root);
  const stale = () => new Error(`Stale ${platform} game assets. Run npm run ${platform === 'web' ? 'build' : 'mobile:prepare'} before testing/building.`);
  if (!fs.existsSync(path.join(target, MANIFEST))) throw stale();
  const actual = JSON.parse(fs.readFileSync(path.join(target, MANIFEST), 'utf8'));
  if (actual.schemaVersion !== 1 || actual.contentSha256 !== expected.contentSha256 || JSON.stringify(actual.files) !== JSON.stringify(expected.files)) throw stale();
  const bundled = walk(target).filter(file => file !== MANIFEST).sort();
  if (JSON.stringify(bundled) !== JSON.stringify(Object.keys(expected.files))) throw stale();
  for (const [file, hash] of Object.entries(expected.files)) {
    if (sha(fs.readFileSync(path.join(target, file))) !== hash) throw stale();
  }
  return expected;
}
module.exports = { prepare, check, snapshot, destination, sourceBytes };
if (require.main === module) {
  try {
    const command = process.argv[2];
    const manifest = command === 'check' ? check() : prepare(ROOT, command);
    console.log(`${command}: shared game ${manifest.contentSha256.slice(0, 12)} (${Object.keys(manifest.files).length} files; source ${manifest.sourceCommit || 'archive'})`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
