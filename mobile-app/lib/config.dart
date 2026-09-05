class AppConfig {
  static const String devBaseUrl = 'http://192.168.0.100:4300';
  static const String prodBaseUrl = 'https://api.yourdomain.com';

  static const String devWsUrl = 'ws://192.168.0.100:4300/ws';
  static const String prodWsUrl = 'wss://api.yourdomain.com/ws';

  static const String googleServerClientId =
      '994828674942-tejtf8ntc6md6dvv3uvq0j92js6c42tk.apps.googleusercontent.com';

  static bool _isProd = false;

  static void setEnvironment({required bool isProd}) {
    _isProd = isProd;
  }

  static String get baseUrl => _isProd ? prodBaseUrl : devBaseUrl;
  static String get wsUrl => _isProd ? prodWsUrl : devWsUrl;
}
