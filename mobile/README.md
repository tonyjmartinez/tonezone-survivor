# Tone Zone Survivors — Flutter mobile port

An installable, offline Flutter app for the existing Tone Zone Survivors canvas game. Android and iOS hosts use the official `webview_flutter` plugin; the game engine remains JavaScript, bundled in the app. This is a mobile packaging port, not a Dart/Flame engine rewrite.

## What is included

- The canonical root web game, including current graveyard theme, touch title, farming, combat and sprites.
- The same character selection, difficulty and persistent gold upgrades as the web version.
- Touch joystick, auto attacks, two-finger dash, original weapons/enemies and level-up choices.
- Touch pause/resume, Android Back handling and background auto-pause.
- Portrait layout with Flutter safe areas, original-art launcher icons, no remote game server.
- Android and iOS project scaffolds. iOS has not been built or tested; it needs a Mac/Xcode and signing setup.

The web game and mobile app now share development directly. Edit root `index.html` and `src/**` once; the packaging commands generate both outputs. Mobile assets are ignored generated files, with a SHA-256 manifest and checks that reject stale copies. See [shared development](../docs/SHARED-DEVELOPMENT.md).

## Run on Tonezone

Open the repository in VS Code after restarting it to load the new PATH. Use the commands from the repository root (Node 20+ and Flutter required):

```powershell
cd C:\Users\ajose\develop\tonezone-survivors-mobile
flutter emulators --launch medium_phone
npm run mobile:run -- -d emulator-5554
```

Tools: Flutter `C:\Users\ajose\develop\flutter`, Android SDK `%LOCALAPPDATA%\Android\Sdk`, Android Studio `%LOCALAPPDATA%\Programs\Android\android-studio` (also in the Start menu). The tested emulator is an API 36 x86_64 phone with hardware acceleration.

```powershell
npm run test:packaging
npm run mobile:test
npm run mobile:integration -- -d emulator-5554
npm run mobile:android
npm run mobile:bundle
```

APK output: `build/app/outputs/flutter-apk/app-release.apk`. This local prototype uses Flutter's development signing key even for the optimized release build. Set up owned application IDs, private release signing and store requirements before distribution. No store account or paid build service was configured.

The current Android command-line tools use slash-separated SDK paths. If a future Flutter/Gradle auto-install reports `Package ndk not found`, explicitly install the requested version using `android --no-metrics sdk install ndk/28.2.13676358` (or the new version requested by the build).

## Game source and tests

`assets/game/` is generated from root `index.html` and `src/**`; never edit it. The Flutter wrapper commands regenerate it before every run/test/build. Run `npm run mobile:prepare` first when using Flutter directly or regenerating icons. `npm run mobile:check` detects stale/tampered output. `tests/mobile-smoke.js` runs the same touch selection, pause, dash, farming, upgrades and reload flow against both the canonical web entry and the mobile bundle. Run it with the same `NODE_PATH`/`CHROMIUM` setup as the original smoke test. `integration_test/mobile_game_test.dart` exercises the actual Android WebView.

`assets/native/host.js` only bridges native lifecycle/back handling. `lib/main.dart` owns the native view, safe areas, loading and navigation. Every game menu and input handler belongs to shared root `src/`. `tool/generate-icons.js` produces Android/iOS icons from the existing pixel sprite pipeline.

Factory checkout for review: `C:\Users\ajose\develop\tonezone-survivors-mobile` (`/mnt/c/Users/ajose/develop/tonezone-survivors-mobile` from Ubuntu), branch `codex/flutter-mobile`. This is separate from the shared factory and game checkouts. Read the factory chat before coordinating any source refresh or merge. No factory policy, budget, loop or daemon changes are part of this port.
