import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  WebSocketChannel? _channel;
  final StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get stream => _controller.stream;

  void connect() {
    _channel = WebSocketChannel.connect(Uri.parse(AppConfig.wsUrl));

    _channel!.stream.listen(
      (data) {
        final message = jsonDecode(data.toString());
        _controller.add(Map<String, dynamic>.from(message));
      },
      onError: (error) {
        debugPrint('WebSocket error: $error');
        _reconnect();
      },
      onDone: () {
        _reconnect();
      },
    );
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 3), () {
      connect();
    });
  }

  void joinRoom(String deviceId) {
    _channel?.sink.add(jsonEncode({
      'type': 'JOIN_ROOM',
      'deviceId': deviceId,
    }));
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
