import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config.dart';
import 'secure_storage.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  final SecureStorage _storage = SecureStorage();
  WebSocketChannel? _channel;
  final Set<String> _joinedRooms = {};
  final StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();

  bool _isConnected = false;
  bool _isConnecting = false;
  Timer? _reconnectTimer;

  Stream<Map<String, dynamic>> get stream => _controller.stream;
  bool get isConnected => _isConnected;

  Future<void> connect() async {
    if (_isConnected || _isConnecting) return;
    _isConnecting = true;
    _reconnectTimer?.cancel();

    try {
      final token = await _storage.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('WebSocket: No auth token found. Skipping connection.');
        _isConnecting = false;
        return;
      }

      // Safely close previous channel before creating a new one
      try {
        _channel?.sink.close();
      } catch (_) {}

      final uri = Uri.parse('${AppConfig.wsUrl}?token=$token');
      final channel = WebSocketChannel.connect(uri);
      _channel = channel;

      channel.stream.listen(
        (data) {
          if (!_isConnected) {
            _isConnected = true;
            _isConnecting = false;
          }
          try {
            final message = jsonDecode(data.toString());
            _controller.add(Map<String, dynamic>.from(message));
          } catch (_) {}
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _handleDisconnect();
        },
        onDone: () {
          _handleDisconnect();
        },
        cancelOnError: true,
      );

      _isConnected = true;
      _isConnecting = false;

      // Re-join existing rooms upon connection
      for (final room in _joinedRooms) {
        _channel?.sink.add(jsonEncode({
          'type': 'JOIN_ROOM',
          'deviceId': room,
        }));
      }
    } catch (e) {
      debugPrint('WebSocket connect exception: $e');
      _handleDisconnect();
    }
  }

  void _handleDisconnect() {
    _isConnected = false;
    _isConnecting = false;
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      connect();
    });
  }

  void joinRoom(String deviceId) {
    if (deviceId.trim().isEmpty) return;
    final clean = deviceId.trim();
    _joinedRooms.add(clean);
    if (_isConnected && _channel != null) {
      try {
        _channel?.sink.add(jsonEncode({
          'type': 'JOIN_ROOM',
          'deviceId': clean,
        }));
      } catch (_) {}
    }
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _isConnected = false;
    _isConnecting = false;
    try {
      _channel?.sink.close();
    } catch (_) {}
    _channel = null;
  }

  void dispose() {
    disconnect();
    _controller.close();
  }
}
