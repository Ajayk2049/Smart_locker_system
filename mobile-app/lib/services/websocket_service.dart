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

  Stream<Map<String, dynamic>> get stream => _controller.stream;

  Future<void> connect() async {
    try {
      final token = await _storage.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('WebSocket: No auth token found. Skipping connection.');
        return;
      }

      final uri = Uri.parse('${AppConfig.wsUrl}?token=$token');
      _channel = WebSocketChannel.connect(uri);

      _channel!.stream.listen(
        (data) {
          try {
            final message = jsonDecode(data.toString());
            _controller.add(Map<String, dynamic>.from(message));
          } catch (_) {}
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _reconnect();
        },
        onDone: () {
          _reconnect();
        },
      );

      // Re-join existing rooms upon connection
      for (final room in _joinedRooms) {
        _channel?.sink.add(jsonEncode({
          'type': 'JOIN_ROOM',
          'deviceId': room,
        }));
      }
    } catch (e) {
      debugPrint('WebSocket connect exception: $e');
      _reconnect();
    }
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 3), () {
      connect();
    });
  }

  void joinRoom(String deviceId) {
    if (deviceId.trim().isEmpty) return;
    final clean = deviceId.trim();
    _joinedRooms.add(clean);
    try {
      _channel?.sink.add(jsonEncode({
        'type': 'JOIN_ROOM',
        'deviceId': clean,
      }));
    } catch (_) {}
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
  }

  void dispose() {
    disconnect();
    _controller.close();
  }
}
