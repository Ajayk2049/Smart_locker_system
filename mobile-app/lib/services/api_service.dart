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

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/api/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register(String email, String password) async {
    final response = await _dio.post('/api/auth/register', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

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
}
