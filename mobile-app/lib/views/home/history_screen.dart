import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';
import '../widgets/glass_theme.dart';
import '../widgets/parcel_history_tile.dart';

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

    final filteredLogs = home.logs.where((l) => l.action.toLowerCase() != 'door_open').toList();

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
          : filteredLogs.isEmpty
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
                      itemCount: filteredLogs.length,
                      itemBuilder: (context, index) {
                        return ParcelHistoryTile(log: filteredLogs[index]);
                      },
                    ),
                  ),
                ),
    );
  }
}
