import 'dart:async';
import 'package:flutter/material.dart';
import '../services/websocket_service.dart';

class WebSocketViewModel extends ChangeNotifier {
  final WebSocketService _ws = WebSocketService();

  bool _connected = false;
  Map<String, dynamic>? _lastMessage;

  bool get connected => _connected;
  Map<String, dynamic>? get lastMessage => _lastMessage;

  StreamSubscription<Map<String, dynamic>>? _subscription;

  void connect() {
    _ws.connect();
    _connected = true;
    notifyListeners();

    _subscription = _ws.stream.listen((message) {
      _lastMessage = message;
      notifyListeners();
    });
  }

  void joinRoom(String deviceId) {
    _ws.joinRoom(deviceId);
  }

  void disconnect() {
    _ws.disconnect();
    _connected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _ws.dispose();
    super.dispose();
  }
}
