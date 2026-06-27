import 'package:flutter/material.dart';
import '../models/device.model.dart';
import '../models/log.model.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class HomeViewModel extends ChangeNotifier {
  final ApiService _api = ApiService();
  final WebSocketService _ws = WebSocketService();

  List<DeviceModel> _devices = [];
  List<LogModel> _logs = [];
  bool _loading = false;
  String? _error;
  String? _selectedDeviceId;

  List<DeviceModel> get devices => _devices;
  List<LogModel> get logs => _logs;
  bool get loading => _loading;
  String? get error => _error;
  String? get selectedDeviceId => _selectedDeviceId;

  DeviceModel? get selectedDevice {
    if (_selectedDeviceId == null) return null;
    try {
      return _devices.firstWhere((d) => d.id == _selectedDeviceId);
    } catch (_) {
      return null;
    }
  }

  void init() {
    _ws.connect();
    _ws.stream.listen((message) {
      _handleWebSocketMessage(message);
    });
    fetchDevices();
  }

  void _handleWebSocketMessage(Map<String, dynamic> message) {
    final type = message['type'];
    if (type == 'DOOR_OPEN' || type == 'DELIVERY_SUCCESS') {
      fetchDevices();
    }
  }

  Future<void> fetchDevices() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final devicesData = await _api.getDevices();
      _devices = devicesData
          .map((json) => DeviceModel.fromJson(json))
          .toList();
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> unlockDevice(String deviceId) async {
    _error = null;
    notifyListeners();

    try {
      await _api.unlockDevice(deviceId);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> fetchDeviceLogs(String deviceId) async {
    _selectedDeviceId = deviceId;
    notifyListeners();

    try {
      final logsData = await _api.getDeviceLogs(deviceId);
      _logs = logsData
          .map((json) => LogModel.fromJson(json))
          .toList();
      _ws.joinRoom(deviceId);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _ws.dispose();
    super.dispose();
  }
}
