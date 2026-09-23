import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';
import '../widgets/glass_theme.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final deviceId = ModalRoute.of(context)?.settings.arguments as String?;
      if (deviceId != null) {
        context.read<HomeViewModel>().fetchDeviceLogs(deviceId);
      } else {
        final home = context.read<HomeViewModel>();
        if (home.devices.isNotEmpty) {
          home.fetchDeviceLogs(home.devices.first.deviceId);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeViewModel>();
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return ParcelGlassScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: primaryTextColor, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Locker Activity History',
          style: TextStyle(
            color: primaryTextColor,
            fontWeight: FontWeight.w900,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      child: home.loading
          ? const Center(
              child: CircularProgressIndicator(color: ParcelGlassColors.mintSignal),
            )
          : home.logs.isEmpty
              ? Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 380),
                    child: LiquidParcelCard(
                      borderRadius: 22,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history_toggle_off, color: secondaryTextColor, size: 22),
                          const SizedBox(width: 12),
                          Text(
                            'No activity recorded yet',
                            style: TextStyle(
                              color: secondaryTextColor,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 380),
                    child: ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: home.logs.length,
                      itemBuilder: (context, index) {
                        final log = home.logs[index];
                        final actionLower = log.action.toLowerCase();
                        final isUnlock = actionLower.contains('unlock');
                        final isLock = actionLower.contains('lock') && !isUnlock;
                        final isDoorOpen = actionLower == 'door_open';
                        final isDelivery = actionLower.contains('delivery');

                        final IconData icon = isUnlock
                            ? Icons.lock_open_rounded
                            : (isLock
                                ? Icons.lock_rounded
                                : (isDelivery
                                    ? Icons.inventory_2_outlined
                                    : (isDoorOpen ? Icons.sensor_door_outlined : Icons.history_rounded)));

                        final Color iconColor = isUnlock
                            ? ParcelGlassColors.mintSignal
                            : (isLock
                                ? ParcelGlassColors.accentBlue
                                : (isDelivery
                                    ? const Color(0xFF6366F1)
                                    : (isDoorOpen ? ParcelGlassColors.amberSignal : ParcelGlassColors.slateSubtitle)));

                        String title;
                        if (isUnlock) {
                          title = 'Locker Unlocked';
                        } else if (isLock) {
                          title = 'Locker Locked & Secured';
                        } else if (isDoorOpen) {
                          title = 'Door Sensor Opened';
                        } else if (isDelivery) {
                          title = 'Package Delivered & Locked';
                        } else {
                          title = log.action.replaceAll('_', ' ').toUpperCase();
                        }

                        final metadata = log.metadata ?? {};
                        final String? actorName = metadata['userName']?.toString();
                        final String? actorRole = metadata['userRole']?.toString();

                        final timeClock =
                            '${log.timestamp.hour.toString().padLeft(2, '0')}:${log.timestamp.minute.toString().padLeft(2, '0')}';
                        final timeStr = _formatTimestamp(log.timestamp);

                        return LiquidParcelCard(
                          borderRadius: 22,
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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
                                        fontWeight: FontWeight.w800,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    if (actorName != null && actorName.isNotEmpty) ...[
                                      Row(
                                        children: [
                                          Text(
                                            'by $actorName',
                                            style: TextStyle(
                                              color: secondaryTextColor,
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          if (actorRole != null && actorRole.isNotEmpty) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: actorRole.toLowerCase().contains('owner') && !actorRole.toLowerCase().contains('co')
                                                    ? ParcelGlassColors.mintSignal.withValues(alpha: 0.18)
                                                    : ParcelGlassColors.accentBlue.withValues(alpha: 0.18),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                actorRole.toUpperCase(),
                                                style: TextStyle(
                                                  color: actorRole.toLowerCase().contains('owner') && !actorRole.toLowerCase().contains('co')
                                                      ? const Color(0xFF047857)
                                                      : ParcelGlassColors.accentBlue,
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w800,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
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
                                  color: Colors.white.withValues(alpha: 0.5),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
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
                        );
                      },
                    ),
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
