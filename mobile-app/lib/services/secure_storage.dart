import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  FlutterSecureStorage get storage => _storage;

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<void> saveRefreshToken(String refreshToken) async {
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  Future<void> deleteRefreshToken() async {
    await _storage.delete(key: 'refresh_token');
  }

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> saveIdentifier(String identifier) async {
    await _storage.write(key: 'saved_identifier', value: identifier);
  }

  Future<String?> getSavedIdentifier() async {
    return await _storage.read(key: 'saved_identifier');
  }

  Future<void> clearSavedIdentifier() async {
    await _storage.delete(key: 'saved_identifier');
  }

  Future<void> saveUserData(String userJson) async {
    await _storage.write(key: 'user_profile', value: userJson);
  }

  Future<String?> getUserData() async {
    return await _storage.read(key: 'user_profile');
  }

  Future<void> deleteUserData() async {
    await _storage.delete(key: 'user_profile');
  }

  /// Purges all session tokens, credentials, and cached profile data on logout
  Future<void> purgeAllSessionData() async {
    await deleteToken();
    await deleteRefreshToken();
    await deleteUserData();
  }
}
