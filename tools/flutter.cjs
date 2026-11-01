// Always refresh shared assets before invoking Flutter. No Flutter SDK needed for web builds.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { prepare, check } = require('./package-game.cjs');
const commands = {
  run: ['run'], apk: ['build', 'apk', '--release'], appbundle: ['build', 'appbundle', '--release'],
  test: ['test'], integration: ['test', 'integration_test/mobile_game_test.dart'],
};
const command = process.argv[2];
if (!commands[command]) { console.error(`Unknown Flutter task: ${command}`); process.exit(1); }
try { prepare(); check(); } catch (error) { console.error(error.message); process.exit(1); }
// shell is required for Flutter's Windows .bat launcher. Reject shell metacharacters
// in forwarded arguments; pass only ordinary Flutter options such as -d emulator-5554.
const extra = process.argv.slice(3);
if (process.platform === 'win32' && extra.some(arg => /[&|<>^%\r\n"`$]/.test(arg))) {
  console.error('Unsupported shell characters in Flutter arguments'); process.exit(1);
}
const result = spawnSync(process.platform === 'win32' ? 'flutter.bat' : 'flutter', [...commands[command], ...extra], {
  cwd: path.resolve(__dirname, '../mobile'), stdio: 'inherit', shell: process.platform === 'win32',
});
if (result.error) console.error(`Flutter could not start: ${result.error.message}`);
process.exit(result.status ?? 1);
