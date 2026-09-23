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
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: LiquidParcelCard(
                      borderRadius: 24,
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.history_toggle_off, size: 48, color: secondaryTextColor),
                          const SizedBox(height: 14),
                          Text(
                            'No Events Logged Yet',
                            style: TextStyle(
                              color: primaryTextColor,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Solenoid unlocks and courier door interactions will appear here in real-time.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: secondaryTextColor, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  itemCount: home.logs.length,
                  itemBuilder: (context, index) {
                    final log = home.logs[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: LiquidParcelCard(
                        borderRadius: 18,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        child: Row(
                          children: [
                            _getActionIcon(log.action),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _getActionLabel(log.action),
                                    style: TextStyle(
                                      color: primaryTextColor,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    _formatTimestamp(log.timestamp),
                                    style: TextStyle(
                                      color: secondaryTextColor,
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? Colors.black.withValues(alpha: 0.3)
                                    : Colors.black.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                log.action.toUpperCase(),
                                style: TextStyle(
                                  color: secondaryTextColor,
                                  fontSize: 10,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _getActionIcon(String action) {
    IconData icon;
    Color color;

    switch (action.toLowerCase()) {
      case 'unlock':
        icon = Icons.lock_open;
        color = ParcelGlassColors.mintSignal;
        break;
      case 'door_open':
        icon = Icons.door_front_door;
        color = ParcelGlassColors.amberSignal;
        break;
      case 'door_close':
        icon = Icons.door_back_door;
        color = Colors.lightBlueAccent;
        break;
      case 'delivery_success':
        icon = Icons.check_circle;
        color = ParcelGlassColors.mintSignal;
        break;
      default:
        icon = Icons.info_outline;
        color = Colors.grey;
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  String _getActionLabel(String action) {
    switch (action.toLowerCase()) {
      case 'unlock':
        return 'Solenoid Door Unlocked';
      case 'door_open':
        return 'Locker Door Opened';
      case 'door_close':
        return 'Locker Door Closed';
      case 'delivery_success':
        return 'Package Delivery Recorded';
      default:
        return action;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${timestamp.day}/${timestamp.month}/${timestamp.year} ${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}
