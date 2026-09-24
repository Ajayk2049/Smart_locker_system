class DeviceModel {
  final String id;
  final String deviceId;
  final String name;
  final String doorState;
  final bool online;
  final bool isOwner;
  final String userRole;

  DeviceModel({
    required this.id,
    required this.deviceId,
    required this.name,
    required this.doorState,
    required this.online,
    this.isOwner = true,
    this.userRole = 'Owner',
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    return DeviceModel(
      id: json['_id'] ?? '',
      deviceId: json['deviceId'] ?? '',
      name: json['name'] ?? '',
      doorState: json['doorState'] ?? 'closed',
      online: json['online'] ?? false,
      isOwner: json['isOwner'] ?? true,
      userRole: json['userRole'] ?? 'Owner',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'deviceId': deviceId,
      'name': name,
      'doorState': doorState,
      'online': online,
      'isOwner': isOwner,
      'userRole': userRole,
    };
  }
}
