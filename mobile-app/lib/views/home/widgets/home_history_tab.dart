import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../view_models/home_view_model.dart';
import '../../widgets/glass_theme.dart';
import '../../widgets/parcel_history_tile.dart';

class HomeHistoryTab extends StatelessWidget {
  const HomeHistoryTab({super.key});

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeViewModel>();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 95),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 700),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                child: Text(
                  'Activity History',
                  style: TextStyle(
                    color: ParcelGlassColors.navyTitle,
                    fontSize: 25,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
              ),

              const SizedBox(height: 10),

              if (home.loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: CircularProgressIndicator(color: ParcelGlassColors.accentBlue),
                  ),
                )
              else if (home.logs.isEmpty)
                LiquidParcelCard(
                  borderRadius: 22,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.history_toggle_off,
                        color: ParcelGlassColors.slateSubtitle,
                        size: 22,
                      ),
                      SizedBox(width: 12),
                      Text(
                        'No activity recorded yet',
                        style: TextStyle(
                          color: ParcelGlassColors.slateSubtitle,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              else
                for (final log in home.logs.where((l) => l.action.toLowerCase() != 'door_open')) ...[
                  ParcelHistoryTile(log: log),
                ],
            ],
          ),
        ),
      ),
    );
  }
}
