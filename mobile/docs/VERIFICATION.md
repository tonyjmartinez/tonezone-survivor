# Verified Android runtime — 2026-11-01

## Shared game update: 1.0.1+2

The port now consumes canonical web main `f95757d` (source tree's last-touch commit `c6223a1`) including farming, spooky theme and the actual web game's touch menus/input. The duplicate mobile menu/dash implementation is removed. Root `src/` and `index.html` match origin/main unchanged.

- Canonical source fingerprint: `a53926e7b19c32864f4302a1a8aedf3563e2fd7f446a2d273cb6ae4f74513bc2`.
- Windows and Ubuntu `npm run build`, `mobile:check`, and all three packaging tests pass; web/mobile outputs match, source changes/tampering/obsolete output are detected.
- Original engine smoke and shared touch smoke against both web source and mobile assets pass with no JS errors or network requests.
- Flutter analysis and navigation unit test pass.
- Actual API 36 Android WebView integration passes: shared title/character selection, movement, multi-touch dash, plant control, pause/resume, guarded level-up tap and persistent storage.
- `npm run mobile:android` and `npm run mobile:bundle` successfully refresh assets and build optimized APK/AAB. APK 1.0.1+2 installed and played offline on the emulator.
- New native screenshots: [shared title](screenshots/06-shared-title-emulator.png), [shared gameplay](screenshots/07-shared-gameplay-emulator.png).
- APK SHA-256: `4B505E74EAA7008BF7B365FEBBE6F827E4C9DCF8B49F94BA1D4F0E00866A8800`.

## Initial packaging proof: 1.0.0+1 (historical)

Flutter 3.47.9, Dart 3.13.7, Android SDK 36, OpenJDK 21, API 36 x86_64 emulator `medium_phone`, 1080x2400, WHPX acceleration.

Checks completed:

- `flutter analyze`: no issues.
- `flutter test`: navigation test passed.
- `flutter test integration_test/mobile_game_test.dart -d emulator-5554`: passed on the actual Android platform WebView. Verified local asset loading, character choice/start, movement, dash with another touch held, pause/resume, level-up selection and localStorage reload.
- Existing `tests/smoke.js`: passed, no JavaScript errors.
- `tests/mobile-smoke.js`: passed, no network requests or JavaScript errors, bundled engine/sprite files identical to the original source.
- `flutter build apk --release`: 42.3 MiB APK, installed successfully.
- Emulator Wi-Fi and mobile data disabled before launching the release app. Release manifest has no INTERNET permission.
- Actual touch play reached level 2 at 0:33, 32 kills. Screenshots came from `adb shell screencap`, pulled from the emulator; no game-state fixture was used for these screenshots.
- Leaving the app via Android Home during play and returning displayed the mobile pause screen.

Screenshots: [camp](screenshots/01-title-emulator.png), [combat](screenshots/03-touch-emulator.png), [level-up](screenshots/04-levelup-emulator.png), [background pause](screenshots/05-paused-emulator.png).

APK SHA-256: `1917A28BEA243FAA2CCD3F2FC82EE0BB5B429AF8EDABF284C84E597772F2392A`.

The APK is a locally signed prototype. No Play Store/App Store deployment or production signing setup was performed. iOS sources/icons are present but untested until built on a Mac with Xcode.
