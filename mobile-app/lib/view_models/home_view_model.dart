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
    if (type == 'DEVICE_STATUS' || type == 'DOOR_OPEN' || type == 'DELIVERY_SUCCESS') {
      final targetDeviceId = message['deviceId'];
      final newDoorState = message['doorState'];
      final isOnline = message['online'];

      if (targetDeviceId != null && newDoorState != null) {
        bool updated = false;
        for (int i = 0; i < _devices.length; i++) {
          if (_devices[i].id == targetDeviceId || _devices[i].deviceId == targetDeviceId) {
            _devices[i] = DeviceModel(
              id: _devices[i].id,
              deviceId: _devices[i].deviceId,
              name: _devices[i].name,
              doorState: newDoorState,
              online: isOnline ?? _devices[i].online,
            );
            updated = true;
          }
        }
        if (updated) {
          notifyListeners();
        } else {
          fetchDevices();
        }
      } else {
        fetchDevices();
      }
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

      // Subscribe to WebSocket rooms for real-time status updates
      for (final d in _devices) {
        _ws.joinRoom(d.id);
        _ws.joinRoom(d.deviceId);
      }

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

    // Optimistically show door opening in UI
    for (int i = 0; i < _devices.length; i++) {
      if (_devices[i].id == deviceId || _devices[i].deviceId == deviceId) {
        _devices[i] = DeviceModel(
          id: _devices[i].id,
          deviceId: _devices[i].deviceId,
          name: _devices[i].name,
          doorState: 'open',
          online: true,
        );
      }
    }
    notifyListeners();

    try {
      await _api.unlockDevice(deviceId);
      // Auto-sync devices after a short delay
      Future.delayed(const Duration(milliseconds: 1500), () => fetchDevices());
      Future.delayed(const Duration(seconds: 4), () => fetchDevices());
    } catch (e) {
      _error = e.toString();
      fetchDevices(); // revert on failure
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
