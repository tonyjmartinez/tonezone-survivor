import 'package:flutter_test/flutter_test.dart';
import 'package:tonezone_survivors/main.dart';

void main() {
  test('offline navigation rejects remote and executable URLs', () {
    expect(
      isBundledGameUrl(
        'file:///android_asset/flutter_assets/assets/game/index.html',
      ),
      isTrue,
    );
    expect(isBundledGameUrl('about:blank'), isTrue);
    for (final url in [
      'https://example.com',
      'http://localhost:8080',
      'javascript:alert(1)',
      'data:text/html,test',
      'invalid',
    ]) {
      expect(isBundledGameUrl(url), isFalse, reason: url);
    }
  });
}
