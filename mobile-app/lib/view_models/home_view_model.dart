import 'dart:async';
import 'package:flutter/material.dart';
import '../models/device.model.dart';
import '../models/log.model.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class HomeViewModel extends ChangeNotifier {
  final ApiService _api = ApiService();
  final WebSocketService _ws = WebSocketService();
  Timer? _pollTimer;

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

    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _fetchDevicesSilent();
    });
  }

  void _handleWebSocketMessage(Map<String, dynamic> message) {
    final type = message['type']?.toString();
    if (type == 'DEVICE_STATUS' ||
        type == 'DOOR_OPEN' ||
        type == 'DELIVERY_SUCCESS' ||
        type == 'DEVICE_ONLINE' ||
        type == 'DEVICE_OFFLINE') {
      final targetDeviceId = message['deviceId']?.toString();
      final newDoorState = message['doorState']?.toString();
      bool? isOnline = message['online'] as bool?;
      if (type == 'DEVICE_ONLINE') isOnline = true;
      if (type == 'DEVICE_OFFLINE') isOnline = false;

      if (targetDeviceId != null) {
        bool updated = false;
        final targetUpper = targetDeviceId.trim().toUpperCase();
        for (int i = 0; i < _devices.length; i++) {
          if (_devices[i].id.trim().toUpperCase() == targetUpper ||
              _devices[i].deviceId.trim().toUpperCase() == targetUpper) {
            _devices[i] = _devices[i].copyWith(
              doorState: newDoorState ?? _devices[i].doorState,
              online: isOnline ?? _devices[i].online,
            );
            updated = true;
          }
        }
        if (updated) {
          notifyListeners();
        } else {
          _fetchDevicesSilent();
        }
      } else {
        _fetchDevicesSilent();
      }
    }
  }

  Future<void> _fetchDevicesSilent() async {
    try {
      final devicesData = await _api.getDevices();
      final newDevices = devicesData
          .map((json) => DeviceModel.fromJson(json))
          .toList();

      bool hasChange = false;
      if (newDevices.length != _devices.length) {
        hasChange = true;
      } else {
        for (int i = 0; i < newDevices.length; i++) {
          if (newDevices[i].online != _devices[i].online ||
              newDevices[i].doorState != _devices[i].doorState ||
              newDevices[i].name != _devices[i].name ||
              newDevices[i].isOwner != _devices[i].isOwner ||
              newDevices[i].userRole != _devices[i].userRole) {
            hasChange = true;
            break;
          }
        }
      }

      if (hasChange) {
        _devices = newDevices;
        for (final d in _devices) {
          _ws.joinRoom(d.id);
          _ws.joinRoom(d.deviceId);
        }
        notifyListeners();
      }
    } catch (_) {}
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

      if (_devices.isNotEmpty) {
        final devId = _selectedDeviceId ?? _devices.first.deviceId;
        fetchDeviceLogs(devId);
      }
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
        _devices[i] = _devices[i].copyWith(
          doorState: 'open',
          online: true,
        );
      }
    }
    notifyListeners();

    try {
      await _api.unlockDevice(deviceId);
      // Auto-sync devices and activity history logs
      Future.delayed(const Duration(milliseconds: 600), () => fetchDeviceLogs(deviceId));
      Future.delayed(const Duration(milliseconds: 1500), () => fetchDevices());
      Future.delayed(const Duration(seconds: 4), () => fetchDevices());
    } catch (e) {
      _error = e.toString();
      fetchDevices(); // revert on failure
    }
  }

  Future<void> fetchDeviceLogs(String deviceId) async {
    _selectedDeviceId = deviceId;

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

  Future<void> pairNewDevice(String deviceId, String name) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.pairDevice(deviceId: deviceId, name: name);
      await fetchDevices();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> joinDeviceViaCode(String inviteCode) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.joinDevice(inviteCode);
      await fetchDevices();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> renameDevice(String deviceId, String newName) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.updateDeviceName(deviceId, newName);
      // Immediately update local device state in list
      final index = _devices.indexWhere((d) => d.id == deviceId || d.deviceId == deviceId);
      if (index != -1) {
        _devices[index] = _devices[index].copyWith(name: newName);
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }


  void clearError() {
    _error = null;
    notifyListeners();
  }


  @override
  void dispose() {
    _pollTimer?.cancel();
    _ws.dispose();
    super.dispose();
  }
}
