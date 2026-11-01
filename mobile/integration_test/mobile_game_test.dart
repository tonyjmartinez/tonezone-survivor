import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:tonezone_survivors/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('bundled game works inside the Android WebView', (tester) async {
    await tester.pumpWidget(const TonezoneApp());
    final screen = tester.state<GameScreenState>(find.byType(GameScreen));
    for (var attempt = 0; attempt < 60 && !screen.pageReady; attempt++) {
      await tester.pump(const Duration(milliseconds: 500));
      expect(screen.gameError, isNull);
    }
    expect(screen.pageReady, isTrue);
    Future<Object> js(String source) async {
      final result = await screen.controller.runJavaScriptReturningResult(
        source,
      );
      if (result is String && result.startsWith('"')) {
        return jsonDecode(result) as Object;
      }
      return result;
    }

    Future<void> run(String source) => screen.controller.runJavaScript(source);
    await run('localStorage.clear()');
    await screen.controller.reload();
    await tester.pump(const Duration(seconds: 2));
    expect(await js('window.__tzs.state'), 'title');
    expect((await screen.controller.currentUrl())!.startsWith('file:'), isTrue);
    await run("document.getElementById('next').click()");
    expect(
      await js("document.getElementById('character-name').textContent"),
      'Knight',
    );
    await run("document.getElementById('start').click()");
    await tester.pump(const Duration(seconds: 1));
    expect(await js('window.__tzs.state'), 'play');
    expect(await js('Boolean(window.__tzs.G.w.whip)'), isTrue);
    // Exercise the same pointer events delivered by a touch joystick.
    await run("""
      const canvas = document.getElementById('c');
      canvas.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1, pointerType: 'touch', clientX: 70, clientY: 400, bubbles: true}));
      canvas.dispatchEvent(new PointerEvent('pointermove', {pointerId: 1, pointerType: 'touch', clientX: 125, clientY: 400, bubbles: true}));
    """);
    await tester.pump(const Duration(seconds: 1));
    expect(await js('window.__tzs.G.p.x > 10'), isTrue);
    await run("""
      const button = window.__tzs.dashBtn();
      document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown', {pointerId: 2, pointerType: 'touch', clientX: button.x, clientY: button.y, bubbles: true}));
    """);
    expect(await js('window.__tzs.G.p.dashCd > 0'), isTrue);
    await run('window.TonezoneMobile.pause()');
    expect(await js('window.__tzs.state'), 'pause');
    await run(
      "document.getElementById('resume').click(); window.__tzs.G.p.xp = window.__tzs.G.p.need; window.__tzs.update(0.016)",
    );
    expect(await js('window.__tzs.state'), 'levelup');
    expect(await js('window.__tzs.G.choices.length'), 3);
    await run("window.__tzs.press('1')");
    expect(await js('window.__tzs.state'), 'play');
    // Verify progress survives reloading the bundled page.
    await run(
      "localStorage.setItem('tzs_gold', '47'); window.TonezoneMobile.pause()",
    );
    await screen.controller.reload();
    await tester.pump(const Duration(seconds: 2));
    expect(await js("Number(localStorage.getItem('tzs_gold'))"), 47);
    expect(screen.gameError, isNull);
    final evidence = await js(
      "JSON.stringify({source: TonezoneMobile.sourceRevision, state: __tzs.state, offline: location.protocol === 'file:', width: innerWidth, height: innerHeight})",
    );
    // The native test log records the actual device runtime, not a browser mock.
    // ignore: avoid_print
    print('MOBILE_RUNTIME ${jsonEncode(evidence)}');
    await run('localStorage.clear()');
  });
}
