# Tone Zone Survivors — Flutter mobile port

An installable, offline Flutter app for the existing Tone Zone Survivors canvas game. Android and iOS hosts use the official `webview_flutter` plugin; the game engine remains JavaScript, bundled in the app. This is a mobile packaging port, not a Dart/Flame engine rewrite.

## What is included

- Original engine and pixel sprites from committed main `1a6b3f5`, copied without changes.
- A touch camp menu: six characters, difficulty, sound and persistent gold upgrades.
- Touch joystick, auto attacks, two-finger dash, original weapons/enemies and level-up choices.
- Touch pause/resume, Android Back handling and background auto-pause.
- Portrait layout with Flutter safe areas, original-art launcher icons, no remote game server.
- Android and iOS project scaffolds. iOS has not been built or tested; it needs a Mac/Xcode and signing setup.

The first port intentionally pins the committed game. Concurrent farming/graveyard work in other branches is not included. Update the bundled engine explicitly after those changes land and repeat both smoke tests.

## Run on Tonezone

Open this `mobile` directory in VS Code after restarting it to load the new PATH.

```powershell
flutter pub get
flutter emulators --launch medium_phone
flutter run -d emulator-5554
```

Tools: Flutter `C:\Users\ajose\develop\flutter`, Android SDK `%LOCALAPPDATA%\Android\Sdk`, Android Studio `%LOCALAPPDATA%\Programs\Android\android-studio` (also in the Start menu). The tested emulator is an API 36 x86_64 phone with hardware acceleration.

```powershell
flutter analyze
flutter test
flutter test integration_test/mobile_game_test.dart -d emulator-5554
flutter build apk --release
```

APK output: `build/app/outputs/flutter-apk/app-release.apk`. This local prototype uses Flutter's development signing key even for the optimized release build. Set up owned application IDs, private release signing and store requirements before distribution. No store account or paid build service was configured.

The current Android command-line tools use slash-separated SDK paths. If a future Flutter/Gradle auto-install reports `Package ndk not found`, explicitly install the requested version using `android --no-metrics sdk install ndk/28.2.13676358` (or the new version requested by the build).

## Game source and tests

`assets/game/src/` is a snapshot of root `src/`; `tests/mobile-smoke.js` checks their equality and tests touch selection, start, pause, dash, upgrades and offline reload in a browser. Run it with the same `NODE_PATH`/`CHROMIUM` setup as the repository's original smoke test. `integration_test/mobile_game_test.dart` exercises the actual platform WebView on Android, including movement, two-finger dash and persistent storage.

`assets/game/mobile.js` adapts the game's existing test/input API without editing its engine. `lib/main.dart` owns the native view, lifecycle and navigation. `tool/generate-icons.js` produces Android/iOS icons from the existing pixel sprite pipeline.

Factory checkout for review: `C:\Users\ajose\develop\tonezone-survivors-mobile` (`/mnt/c/Users/ajose/develop/tonezone-survivors-mobile` from Ubuntu), branch `codex/flutter-mobile`. This is separate from the shared factory and game checkouts. Read the factory chat before coordinating any source refresh or merge. No factory policy, budget, loop or daemon changes are part of this port.
