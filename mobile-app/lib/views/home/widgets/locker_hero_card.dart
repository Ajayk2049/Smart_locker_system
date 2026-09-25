import 'package:flutter/material.dart';
import '../../../models/device.model.dart';
import '../../widgets/glass_theme.dart';
import '../../widgets/liquid_slide_to_unlock.dart';

class LockerHeroCard extends StatelessWidget {
  final DeviceModel device;
  final bool isUnlocking;
  final Future<void> Function() onUnlock;
  final VoidCallback onInviteCoOwner;

  const LockerHeroCard({
    super.key,
    required this.device,
    required this.isUnlocking,
    required this.onUnlock,
    required this.onInviteCoOwner,
  });

  @override
  Widget build(BuildContext context) {
    final isOnline = device.online;
    final isDoorOpen = device.doorState.toLowerCase() == 'open';

    return LiquidParcelCard(
      useStaticGlass: true,
      borderRadius: 26,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Device Name & Online Indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.name.isNotEmpty ? device.name : 'Secure Box',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          device.deviceId,
                          style: const TextStyle(
                            color: ParcelGlassColors.slateSubtitle,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (device.isOwner ? ParcelGlassColors.mintSignal : ParcelGlassColors.accentBlue).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: (device.isOwner ? const Color(0xFF047857) : ParcelGlassColors.accentBlue).withValues(alpha: 0.3),
                              width: 1.0,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                device.isOwner ? Icons.admin_panel_settings_rounded : Icons.group_rounded,
                                size: 11,
                                color: device.isOwner ? const Color(0xFF047857) : ParcelGlassColors.accentBlue,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                device.isOwner ? 'PRIMARY OWNER' : 'CO-OWNER',
                                style: TextStyle(
                                  color: device.isOwner ? const Color(0xFF047857) : ParcelGlassColors.accentBlue,
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isOnline
                      ? ParcelGlassColors.mintSignal.withValues(alpha: 0.15)
                      : Colors.amber.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isOnline ? ParcelGlassColors.mintSignal : Colors.amber,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: isOnline ? ParcelGlassColors.mintSignal : Colors.amber,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      isOnline ? 'ONLINE' : 'OFFLINE',
                      style: TextStyle(
                        color: isOnline ? ParcelGlassColors.mintSignal : const Color(0xFFB45309),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Hardware Metrics: Door Sensor + Solenoid Lock
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Icon(
                      isDoorOpen ? Icons.door_front_door : Icons.door_back_door,
                      size: 22,
                      color: isDoorOpen ? ParcelGlassColors.amberSignal : ParcelGlassColors.navyTitle,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'DOOR SENSOR',
                      style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      isDoorOpen ? 'DOOR OPEN' : 'CLOSED',
                      style: TextStyle(
                        color: isDoorOpen ? ParcelGlassColors.amberSignal : ParcelGlassColors.navyTitle,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                Container(width: 1, height: 32, color: Colors.black12),
                Column(
                  children: [
                    const Icon(Icons.lock, size: 22, color: ParcelGlassColors.navyTitle),
                    const SizedBox(height: 4),
                    const Text(
                      'SOLENOID',
                      style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      isDoorOpen ? 'UNLATCHED' : 'ENGAGED',
                      style: const TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Central Hero: Slide to Unlock
          LiquidSlideToUnlock(
            isUnlocking: isUnlocking,
            isLockerOnline: isOnline,
            isUnlocked: isDoorOpen,
            onUnlock: onUnlock,
          ),

          // Co-Owner invite action (Owner only)
          if (device.isOwner) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onInviteCoOwner,
                icon: const Icon(Icons.person_add_alt_1, size: 16, color: ParcelGlassColors.accentBlue),
                label: const Text(
                  'Invite Family / Co-Owner',
                  style: TextStyle(color: ParcelGlassColors.accentBlue, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
