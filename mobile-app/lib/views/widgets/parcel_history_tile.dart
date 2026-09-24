import 'package:flutter/material.dart';
import '../../models/log.model.dart';
import 'glass_theme.dart';

class ParcelHistoryTile extends StatelessWidget {
  final LogModel log;

  const ParcelHistoryTile({
    super.key,
    required this.log,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : ParcelGlassColors.navyTitle;
    final secondaryTextColor = isDark ? Colors.white70 : ParcelGlassColors.slateSubtitle;

    final actionLower = log.action.toLowerCase();
    final isUnlock = actionLower.contains('unlock');
    final isLock = actionLower.contains('lock') && !isUnlock;
    final isDoorOpen = actionLower == 'door_open';
    final isDelivery = actionLower.contains('delivery');
    final isCoOwnerAdded = actionLower.contains('co_owner_added');
    final isCoOwnerRemoved = actionLower.contains('co_owner_removed');

    final IconData icon = isUnlock
        ? Icons.lock_open_rounded
        : (isLock
            ? Icons.lock_rounded
            : (isDelivery
                ? Icons.inventory_2_outlined
                : (isCoOwnerAdded
                    ? Icons.person_add_rounded
                    : (isCoOwnerRemoved
                        ? Icons.person_remove_rounded
                        : (isDoorOpen ? Icons.sensor_door_outlined : Icons.history_rounded)))));

    final Color iconColor = isUnlock
        ? ParcelGlassColors.mintSignal
        : (isLock
            ? ParcelGlassColors.accentBlue
            : (isDelivery
                ? const Color(0xFF6366F1)
                : (isCoOwnerAdded
                    ? ParcelGlassColors.accentBlue
                    : (isCoOwnerRemoved
                        ? Colors.redAccent
                        : (isDoorOpen ? ParcelGlassColors.amberSignal : ParcelGlassColors.slateSubtitle)))));

    String title;
    if (isUnlock) {
      title = 'Locker Unlocked';
    } else if (isLock) {
      title = 'Locker Locked & Secured';
    } else if (isDoorOpen) {
      title = 'Door Sensor Opened';
    } else if (isDelivery) {
      title = 'Package Delivered & Locked';
    } else if (isCoOwnerAdded) {
      title = 'Co-Owner Added';
    } else if (isCoOwnerRemoved) {
      title = 'Co-Owner Removed';
    } else {
      title = log.action.replaceAll('_', ' ').toUpperCase();
    }

    final metadata = log.metadata ?? {};
    final String? actorName = metadata['userName']?.toString();

    final timeClock =
        '${log.timestamp.hour.toString().padLeft(2, '0')}:${log.timestamp.minute.toString().padLeft(2, '0')}';
    final timeStr = _formatTimestamp(log.timestamp);

    return RepaintBoundary(
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF241A13).withValues(alpha: 0.65)
              : Colors.white.withValues(alpha: 0.45),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.15)
                : Colors.white.withValues(alpha: 0.65),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3D2310).withValues(alpha: isDark ? 0.25 : 0.08),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: primaryTextColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  if (actorName != null && actorName.isNotEmpty) ...[
                    Text(
                      'by $actorName',
                      style: TextStyle(
                        color: secondaryTextColor,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                  ],
                  Text(
                    '$timeStr at $timeClock',
                    style: TextStyle(
                      color: secondaryTextColor.withValues(alpha: 0.75),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.white.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : Colors.white.withValues(alpha: 0.7),
                ),
              ),
              child: Text(
                timeClock,
                style: TextStyle(
                  color: primaryTextColor,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
    if (isToday) return 'Today';
    final yesterday = now.subtract(const Duration(days: 1));
    final isYesterday = dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day;
    if (isYesterday) return 'Yesterday';

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
