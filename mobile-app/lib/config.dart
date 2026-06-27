class AppConfig {
  static const String devBaseUrl = 'http://localhost:3000';
  static const String prodBaseUrl = 'https://api.yourdomain.com';

  static const String devWsUrl = 'ws://localhost:3000/ws';
  static const String prodWsUrl = 'wss://api.yourdomain.com/ws';

  static bool _isProd = false;

  static void setEnvironment({required bool isProd}) {
    _isProd = isProd;
  }

  static String get baseUrl => _isProd ? prodBaseUrl : devBaseUrl;
  static String get wsUrl => _isProd ? prodWsUrl : devWsUrl;
}
