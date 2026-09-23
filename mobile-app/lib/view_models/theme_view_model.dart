import 'package:flutter/material.dart';
import '../services/secure_storage.dart';

class ThemeViewModel extends ChangeNotifier {
  final SecureStorage _storage = SecureStorage();
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDark => _themeMode == ThemeMode.dark;

  ThemeViewModel() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final saved = await _storage.storage.read(key: 'app_theme_mode');
    if (saved == 'dark') {
      _themeMode = ThemeMode.dark;
    } else {
      _themeMode = ThemeMode.light;
    }
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _themeMode = isDark ? ThemeMode.light : ThemeMode.dark;
    await _storage.storage.write(
      key: 'app_theme_mode',
      value: isDark ? 'dark' : 'light',
    );
    notifyListeners();
  }

  Future<void> setTheme(ThemeMode mode) async {
    _themeMode = mode;
    await _storage.storage.write(
      key: 'app_theme_mode',
      value: mode == ThemeMode.dark ? 'dark' : 'light',
    );
    notifyListeners();
  }
}
