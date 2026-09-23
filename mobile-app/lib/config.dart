import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppConfig {
  static const String defaultLocalHost = '192.168.0.101:4300';
  static const String prodHost = 'api.yourdomain.com';

  static const String googleServerClientId =
      '994828674942-tejtf8ntc6md6dvv3uvq0j92js6c42tk.apps.googleusercontent.com';

  static bool _isProd = false;
  static String _activeHost = defaultLocalHost;
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _hostStorageKey = 'smartbox_server_host';

  static Future<void> init({bool isProd = false}) async {
    _isProd = isProd;
    if (!_isProd) {
      final savedHost = await _storage.read(key: _hostStorageKey);
      if (savedHost != null && savedHost.trim().isNotEmpty) {
        _activeHost = savedHost.trim();
      } else {
        _activeHost = defaultLocalHost;
      }
    }
  }

  static void setEnvironment({required bool isProd}) {
    _isProd = isProd;
  }

  static String get currentHost => _isProd ? prodHost : _activeHost;

  static Future<void> updateHost(String newHost) async {
    final clean = newHost.trim().replaceAll('http://', '').replaceAll('https://', '').replaceAll('/', '');
    if (clean.isNotEmpty) {
      _activeHost = clean;
      await _storage.write(key: _hostStorageKey, value: clean);
    }
  }

  static Future<void> resetToDefaultHost() async {
    _activeHost = defaultLocalHost;
    await _storage.delete(key: _hostStorageKey);
  }

  static String get baseUrl {
    if (_isProd) return 'https://$prodHost';
    return 'http://$_activeHost';
  }

  static String get wsUrl {
    if (_isProd) return 'wss://$prodHost/ws';
    return 'ws://$_activeHost/ws';
  }
}
