import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  runApp(const TonezoneApp());
}

class TonezoneApp extends StatelessWidget {
  const TonezoneApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Tone Zone Survivors',
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true),
    home: const GameScreen(),
  );
}

bool isBundledGameUrl(String url) =>
    Uri.tryParse(url)?.scheme == 'file' || url == 'about:blank';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});
  @override
  State<GameScreen> createState() => GameScreenState();
}

class GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  late final WebViewController controller;
  bool pageReady = false;
  String? gameError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    controller = WebViewController();
    unawaited(_load());
  }

  Future<void> _load() async {
    try {
      await controller.setJavaScriptMode(JavaScriptMode.unrestricted);
      await controller.setBackgroundColor(const Color(0xff0b1214));
      await controller.enableZoom(false);
      await controller.addJavaScriptChannel(
        'TonezoneErrors',
        onMessageReceived: (message) {
          debugPrint('Tonezone game error: ${message.message}');
          if (mounted) setState(() => gameError = message.message);
        },
      );
      await controller.setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) => isBundledGameUrl(request.url)
              ? NavigationDecision.navigate
              : NavigationDecision.prevent,
          onPageFinished: (_) async {
            try {
              await controller.runJavaScript(
                await rootBundle.loadString('assets/native/host.js'),
              );
              final ready = await controller.runJavaScriptReturningResult(
                'Boolean(window.__tzs && window.TonezoneHost)',
              );
              if (ready != true) {
                throw StateError('The shared game did not initialize');
              }
              if (mounted) setState(() => pageReady = true);
            } catch (error) {
              if (mounted) setState(() => gameError = error.toString());
            }
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) {
              setState(() => gameError = error.description);
            }
          },
        ),
      );
      await controller.loadFlutterAsset('assets/game/index.html');
    } catch (error) {
      if (mounted) setState(() => gameError = error.toString());
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (pageReady && state != AppLifecycleState.resumed) {
      unawaited(controller.runJavaScript('window.TonezoneHost.pause()'));
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: false,
    onPopInvokedWithResult: (didPop, result) {
      if (!didPop && pageReady) {
        unawaited(controller.runJavaScript('window.TonezoneHost.back()'));
      }
    },
    child: Scaffold(
      backgroundColor: const Color(0xff0b1214),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(child: WebViewWidget(controller: controller)),
            if (!pageReady && gameError == null)
              const Center(
                child: CircularProgressIndicator(color: Color(0xffe6c36a)),
              ),
            if (gameError != null)
              ColoredBox(
                color: const Color(0xff0b1214),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('The game could not load.'),
                        const SizedBox(height: 12),
                        Text(gameError!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () {
                            setState(() {
                              gameError = null;
                              pageReady = false;
                            });
                            unawaited(_load());
                          },
                          child: const Text('Try again'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}
