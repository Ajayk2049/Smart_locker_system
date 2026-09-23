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

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> saveCredentials({required String identifier, String? password}) async {
    await _storage.write(key: 'saved_identifier', value: identifier);
    if (password != null && password.isNotEmpty) {
      await _storage.write(key: 'saved_password', value: password);
    }
  }

  Future<String?> getSavedIdentifier() async {
    return await _storage.read(key: 'saved_identifier');
  }

  Future<String?> getSavedPassword() async {
    return await _storage.read(key: 'saved_password');
  }

  Future<void> clearCredentials() async {
    await _storage.delete(key: 'saved_identifier');
    await _storage.delete(key: 'saved_password');
  }

  Future<void> saveUserData(String userJson) async {
    await _storage.write(key: 'user_profile', value: userJson);
  }

  Future<String?> getUserData() async {
    return await _storage.read(key: 'user_profile');
  }
}
