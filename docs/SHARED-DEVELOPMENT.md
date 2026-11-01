# One game, web and mobile

The canonical game is root `index.html` + `src/**`. The web deploy and the offline Flutter app consume the same files. The old mobile-specific character/shop/pause/dash implementations are removed; the app uses the web game's actual touch title, pause menu, farming controls, sprites and combat logic.

```
index.html + src/** ── tools/package-game.cjs ──┬── dist/                 (web)
                                             └── mobile/assets/game/  (Android/iOS)
```

Game agents edit the canonical files once. Generated mobile copies are ignored by Git; `game-build.json` records source file hashes and a content fingerprint. `npm run mobile:check` fails on missing, stale, tampered or extra assets. Line endings are normalized for text so Windows and Ubuntu produce the same fingerprint; binary art is preserved.

## Daily work

```sh
# In the same repository checkout, on Ubuntu or Windows (Node 20+):
npm run build                   # Web output, no Flutter required
npm run test:packaging          # Proves both outputs agree and rejects stale bundles
npm run mobile:prepare          # Refresh offline mobile game
npm run mobile:check
node tests/smoke.js             # Existing desktop/engine tests
node tests/mobile-smoke.js      # Same touch/farming/menu flow against web and mobile
```

The smoke tests use the existing Playwright installation and CHROMIUM environment. No game runtime dependencies were added. A factory worker can validate shared web/mobile gameplay entirely on Linux without installing Flutter.

```sh
# On a host with Flutter and Android SDK on PATH:
npm run mobile:run -- -d emulator-5554
npm run mobile:test
npm run mobile:integration -- -d emulator-5554 --reporter expanded
npm run mobile:android          # Optimized APK
npm run mobile:bundle           # Android App Bundle
```

Each Flutter wrapper refreshes and verifies game assets first, so the next mobile build includes the web changes in that checkout. When editing JavaScript during a running mobile session, run `npm run mobile:prepare`, then hot restart Flutter (`R`); the WebView must be recreated to load the refreshed files. Direct `flutter` commands require running `mobile:prepare` first, especially in a fresh checkout. Build and test iOS on a Mac with the same preparation step.

The current Flutter asset list covers the entry folder and flat `src/` folder. If adding nested asset directories under `src`, add their paths to `mobile/pubspec.yaml` so Flutter bundles them. The packager itself copies subdirectories and validates them.

## Boundaries and coordination

- Shared game owners: `claude-farm` / existing web game agents. Keep existing factory claims/worktrees/review rules.
- Native host: `mobile/lib/` plus `mobile/assets/native/host.js`. The bridge only pauses/clears input on native lifecycle changes and handles Android Back. It relies on `__tzs.state`, `keys`, `setTouch`, and `press`; coordinate changes to those functions.
- Both platforms use the same title/pause/plant/dash/input code. Browser versus installed app storage is separate; local progress is not cloud-synced.
- Web updates still deploy through the existing main-branch hosting connection. Installed APKs are offline snapshots: they pick up new code after rebuilding and installing an update. No over-the-air updater or new factory loop was added.
- Native build automation/CI is a follow-up. Existing `.github` files and factory scheduling/budgets are unchanged in this PR.

This integration consumes web main `f95757d`, including graveyard theming, touch UI, multi-touch dash fixes and farming. Original shared engine files are unchanged by the mobile packaging work.
