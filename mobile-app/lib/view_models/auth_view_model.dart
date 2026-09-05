import 'package:flutter/material.dart';
import '../models/user.model.dart';
import '../services/api_service.dart';
import '../services/secure_storage.dart';

class AuthViewModel extends ChangeNotifier {
  final ApiService _api = ApiService();
  final SecureStorage _storage = SecureStorage();

  UserModel? _user;
  bool _loading = false;
  String? _error;

  UserModel? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> init() async {
    final hasToken = await _storage.hasToken();
    if (hasToken) {
      // Validate token and fetch user profile
    }
    notifyListeners();
  }

  // 1. Smart Pre-Check & Send OTP
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.sendOtp(phone);
      _loading = false;
      notifyListeners();
      return response;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return {'success': false, 'error': e.toString()};
    }
  }

  // 2. Register Account with OTP (+ optional Join Code)
  Future<bool> registerWithOtp({
    required String phone,
    required String otp,
    required String password,
    String? name,
    String? inviteCode,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.registerWithOtp(
        phone: phone,
        otp: otp,
        password: password,
        name: name,
        inviteCode: inviteCode,
      );
      await _storage.saveToken(response['token']);
      _user = UserModel.fromJson(response['user']);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // 3. Login (Phone or Email + Password)
  Future<bool> login(String identifier, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.login(identifier, password);
      await _storage.saveToken(response['token']);
      _user = UserModel.fromJson(response['user']);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteToken();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
