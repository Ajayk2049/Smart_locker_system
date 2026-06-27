class DeviceModel {
  final String id;
  final String deviceId;
  final String name;
  final String doorState;
  final int battery;
  final bool online;

  DeviceModel({
    required this.id,
    required this.deviceId,
    required this.name,
    required this.doorState,
    required this.battery,
    required this.online,
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    return DeviceModel(
      id: json['_id'] ?? '',
      deviceId: json['deviceId'] ?? '',
      name: json['name'] ?? '',
      doorState: json['doorState'] ?? 'closed',
      battery: json['battery'] ?? 100,
      online: json['online'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'deviceId': deviceId,
      'name': name,
      'doorState': doorState,
      'battery': battery,
      'online': online,
    };
  }
}
