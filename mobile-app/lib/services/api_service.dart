import 'package:dio/dio.dart';
import '../config.dart';
import 'secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final SecureStorage _storage = SecureStorage();

  Future<Dio> get authDio async {
    final token = await _storage.getToken();
    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      headers: {
        if (token != null) 'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ));
    return dio;
  }

  // 1. Smart Pre-Check & Send OTP
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    try {
      final response = await _dio.post('/api/auth/send-otp', data: {
        'phone': phone,
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response!.data is Map) {
        return Map<String, dynamic>.from(e.response!.data);
      }
      rethrow;
    }
  }

  // 2. Register with OTP (+ optional Join Code)
  Future<Map<String, dynamic>> registerWithOtp({
    required String phone,
    required String otp,
    required String password,
    String? name,
    String? inviteCode,
  }) async {
    final response = await _dio.post('/api/auth/register-with-otp', data: {
      'phone': phone,
      'otp': otp,
      'password': password,
      if (name != null && name.isNotEmpty) 'name': name,
      if (inviteCode != null && inviteCode.isNotEmpty) 'inviteCode': inviteCode,
    });
    return response.data;
  }

  // 3. Login (Phone or Email + Password)
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await _dio.post('/api/auth/login', data: {
      'identifier': identifier,
      'password': password,
    });
    return response.data;
  }

  // 4. Device Management
  Future<List<dynamic>> getDevices() async {
    final dio = await authDio;
    final response = await dio.get('/api/devices');
    return response.data['devices'];
  }

  Future<void> unlockDevice(String deviceId) async {
    final dio = await authDio;
    await dio.post('/api/devices/$deviceId/unlock');
  }

  Future<List<dynamic>> getDeviceLogs(String deviceId) async {
    final dio = await authDio;
    final response = await dio.get('/api/devices/$deviceId/logs');
    return response.data['logs'];
  }

  // 5. Join Code Co-Owner System
  Future<Map<String, dynamic>> createInviteCode(String deviceId) async {
    final dio = await authDio;
    final response = await dio.post('/api/devices/$deviceId/invite', data: {});
    return response.data;
  }

  Future<Map<String, dynamic>> joinDevice(String inviteCode) async {
    final dio = await authDio;
    final response = await dio.post('/api/devices/join', data: {
      'inviteCode': inviteCode,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getDeviceSlots(String deviceId) async {
    final dio = await authDio;
    final response = await dio.get('/api/devices/$deviceId/slots');
    return response.data;
  }
}
