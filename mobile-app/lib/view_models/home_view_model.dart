import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/device.model.dart';
import '../models/log.model.dart';
import '../services/api_service.dart';
import '../services/connectivity_service.dart';
import '../services/secure_storage.dart';
import '../services/websocket_service.dart';

class HomeViewModel extends ChangeNotifier {
  final ApiService _api = ApiService();
  final WebSocketService _ws = WebSocketService();
  final ConnectivityService _connectivity = ConnectivityService();
  final SecureStorage _storage = SecureStorage();

  Timer? _pollTimer;
  final Map<String, DateTime> _recentlyUnlockedUntil = {};

  List<DeviceModel> _devices = [];
  List<LogModel> _logs = [];
  bool _loading = false;
  String? _error;
  String? _selectedDeviceId;
  ConnectionIssue _connectionIssue = ConnectionIssue.none;
  bool _isDiagnosing = false;
  bool _isCheckingReachability = true;

  int _failedPollAttempts = 0;
  int _offlineTickCounter = 0;
  static const int maxFailedAttempts = 3;
  bool _isInitialized = false;

  List<DeviceModel> get devices => _devices;
  List<LogModel> get logs => _logs;
  bool get loading => _loading;
  String? get error => _error;
  String? get selectedDeviceId => _selectedDeviceId;
  ConnectionIssue get connectionIssue => _connectionIssue;
  bool get isOffline => _connectionIssue != ConnectionIssue.none;
  bool get isCheckingReachability => _isCheckingReachability;

  DeviceModel? get selectedDevice {
    if (_selectedDeviceId == null) return null;
    try {
      return _devices.firstWhere((d) => d.id == _selectedDeviceId);
    } catch (_) {
      return null;
    }
  }

  Future<void> init() async {
    if (_isInitialized) return;
    _isInitialized = true;
    _isCheckingReachability = true;

    // 1. Immediately load cached devices from storage (strictly offline until server verifies)
    await _loadCachedDevices();

    // 2. Perform fast startup connectivity diagnosis (<1.5s)
    final initialIssue = await _connectivity.checkConnectivity();
    _connectionIssue = initialIssue;
    _isCheckingReachability = false;

    if (initialIssue != ConnectionIssue.none) {
      // Server down or no internet: keep devices offline and show status bar
      _devices = _devices.map((d) => d.copyWith(online: false)).toList();
      notifyListeners();
    } else {
      // Server is online: connect WebSocket and sync fresh cloud devices
      _ws.connect();
      _ws.stream.listen((message) {
        _handleWebSocketMessage(message);
      });
      await fetchDevices();
    }

    // 3. Setup polling timer with smart attempt backoff
    _setupPollTimer();
  }

  void _setupPollTimer() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (isOffline) {
        // When offline, throttle from 4s to ~28s (every 7 ticks) to conserve battery
        _offlineTickCounter++;
        if (_offlineTickCounter < 7) return;
        _offlineTickCounter = 0;
      }
      _fetchDevicesSilent();
    });
  }

  Future<void> _loadCachedDevices() async {
    try {
      final cachedJson = await _storage.getCachedDevices();
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final decoded = jsonDecode(cachedJson);
        if (decoded is List && decoded.isNotEmpty) {
          // Initialize cached devices with online: false until actively verified
          _devices = decoded.map((j) {
            final model = DeviceModel.fromJson(j);
            return model.copyWith(online: false);
          }).toList();
          _selectedDeviceId ??= _devices.first.deviceId;
          notifyListeners();
          // Preload 7-day cached logs
          _loadCachedLogs(_selectedDeviceId!);
        }
      }
    } catch (_) {}
  }

  Future<void> _loadCachedLogs(String deviceId) async {
    try {
      final cached = await _storage.getCachedLogs(deviceId);
      if (cached != null && cached.isNotEmpty) {
        _logs = cached.map((j) => LogModel.fromJson(j)).toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  void _handleWebSocketMessage(Map<String, dynamic> message) {
    final type = message['type']?.toString();
    if (type == 'EMERGENCY_UNLOCK') {
      final targetDeviceId = message['deviceId']?.toString();
      if (targetDeviceId != null) {
        fetchDeviceLogs(targetDeviceId);
      }
    }

    if (type == 'DEVICE_STATUS' ||
        type == 'DOOR_OPEN' ||
        type == 'EMERGENCY_UNLOCK' ||
        type == 'DELIVERY_SUCCESS' ||
        type == 'UNLOCK_COMMAND' ||
        type == 'DEVICE_ONLINE' ||
        type == 'DEVICE_OFFLINE') {
      final targetDeviceId = message['deviceId']?.toString();
      String? newDoorState = message['doorState']?.toString();
      if (type == 'DOOR_OPEN' || type == 'EMERGENCY_UNLOCK' || type == 'UNLOCK_COMMAND') {
        newDoorState ??= 'open';
      }
      bool? isOnline = message['online'] as bool?;
      if (type == 'DEVICE_ONLINE') isOnline = true;
      if (type == 'DEVICE_OFFLINE') isOnline = false;

      if (targetDeviceId != null) {
        final targetUpper = targetDeviceId.trim().toUpperCase();
        if (newDoorState == 'closed') {
          _recentlyUnlockedUntil.remove(targetUpper);
        }

        bool updated = false;
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
      _failedPollAttempts = 0;
      if (_connectionIssue != ConnectionIssue.none) {
        _connectionIssue = ConnectionIssue.none;
        notifyListeners();
      }
      final newDevices = devicesData
          .map((json) => DeviceModel.fromJson(json))
          .toList();

      // Persist to local cache
      _storage.saveCachedDevices(jsonEncode(devicesData));
      final updatedDevices = _applyRecentUnlocks(newDevices);

      bool hasChange = false;
      if (updatedDevices.length != _devices.length) {
        hasChange = true;
      } else {
        for (int i = 0; i < updatedDevices.length; i++) {
          if (updatedDevices[i].online != _devices[i].online ||
              updatedDevices[i].doorState != _devices[i].doorState ||
              updatedDevices[i].name != _devices[i].name ||
              updatedDevices[i].isOwner != _devices[i].isOwner ||
              updatedDevices[i].userRole != _devices[i].userRole) {
            hasChange = true;
            break;
          }
        }
      }

      if (hasChange) {
        _devices = updatedDevices;
        for (final d in _devices) {
          _ws.joinRoom(d.id);
          _ws.joinRoom(d.deviceId);
        }
        notifyListeners();
      }
    } catch (_) {
      _failedPollAttempts++;
      if (_failedPollAttempts >= maxFailedAttempts) {
        _diagnoseConnectivity();
      }
    }
  }

  List<DeviceModel> _applyRecentUnlocks(List<DeviceModel> list) {
    final now = DateTime.now();
    return list.map((dev) {
      final until = _recentlyUnlockedUntil[dev.deviceId.trim().toUpperCase()] ??
          _recentlyUnlockedUntil[dev.id.trim().toUpperCase()];
      if (until != null && now.isBefore(until)) {
        return dev.copyWith(doorState: 'open', online: true);
      }
      return dev;
    }).toList();
  }

  Future<void> fetchDevices() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final devicesData = await _api.getDevices();
      _failedPollAttempts = 0;
      if (_connectionIssue != ConnectionIssue.none) {
        _connectionIssue = ConnectionIssue.none;
      }
      final rawDevices = devicesData
          .map((json) => DeviceModel.fromJson(json))
          .toList();

      // Persist to local cache so lockers show even offline
      _storage.saveCachedDevices(jsonEncode(devicesData));

      _devices = _applyRecentUnlocks(rawDevices);

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
      if (_devices.isEmpty) {
        await _loadCachedDevices();
      }
      _devices = _devices.map((d) => d.copyWith(online: false)).toList();
      notifyListeners();
      _diagnoseConnectivity();
    }
  }

  Future<void> _diagnoseConnectivity() async {
    if (_isDiagnosing) return;
    _isDiagnosing = true;
    try {
      final issue = await _connectivity.checkConnectivity();
      if (_connectionIssue != issue) {
        _connectionIssue = issue;
        if (issue != ConnectionIssue.none) {
          _devices = _devices.map((d) => d.copyWith(online: false)).toList();
        }
        notifyListeners();
      }
    } finally {
      _isDiagnosing = false;
    }
  }

  Future<void> retryConnection() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final issue = await _connectivity.checkConnectivity();
      _connectionIssue = issue;
      if (issue == ConnectionIssue.none) {
        _failedPollAttempts = 0;
        _ws.connect();
        await fetchDevices();
      } else {
        _devices = _devices.map((d) => d.copyWith(online: false)).toList();
        _loading = false;
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> unlockDevice(String deviceId) async {
    if (isOffline || _isCheckingReachability) {
      throw Exception('Server unreachable. Unlock disabled.');
    }
    _error = null;
    final targetUpper = deviceId.trim().toUpperCase();

    final targetIndex = _devices.indexWhere(
      (d) => d.id.trim().toUpperCase() == targetUpper || d.deviceId.trim().toUpperCase() == targetUpper,
    );
    if (targetIndex == -1) {
      throw Exception('Locker not found.');
    }
    if (!_devices[targetIndex].online) {
      throw Exception('Locker is currently offline.');
    }

    _recentlyUnlockedUntil[targetUpper] = DateTime.now().add(const Duration(seconds: 10));

    _devices[targetIndex] = _devices[targetIndex].copyWith(doorState: 'open');
    notifyListeners();

    try {
      await _api.unlockDevice(deviceId);
      Future.delayed(const Duration(milliseconds: 600), () => fetchDeviceLogs(deviceId));
      Future.delayed(const Duration(milliseconds: 1500), () => _fetchDevicesSilent());
      Future.delayed(const Duration(seconds: 4), () => _fetchDevicesSilent());
    } catch (e) {
      _recentlyUnlockedUntil.remove(targetUpper);
      _error = e.toString();
      final idx = _devices.indexWhere(
        (d) => d.id.trim().toUpperCase() == targetUpper || d.deviceId.trim().toUpperCase() == targetUpper,
      );
      if (idx != -1) {
        _devices[idx] = _devices[idx].copyWith(doorState: 'closed');
      }
      notifyListeners();
      _diagnoseConnectivity();
      rethrow;
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

      // Persist to local storage with strict 7-day retention filtering
      await _storage.saveCachedLogs(
        deviceId,
        logsData.whereType<Map<String, dynamic>>().toList(),
      );
    } catch (e) {
      _error = e.toString();
      // Load 7-day cached logs when offline
      final cached = await _storage.getCachedLogs(deviceId);
      if (cached != null && cached.isNotEmpty) {
        _logs = cached.map((json) => LogModel.fromJson(json)).toList();
      }
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
