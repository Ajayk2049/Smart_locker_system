import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config.dart';
import '../../view_models/auth_view_model.dart';
import '../../view_models/home_view_model.dart';
import '../widgets/glass_theme.dart';
import '../widgets/network_host_dialog.dart';

class SettingsScreen extends StatelessWidget {
  final VoidCallback? onBackToHome;

  const SettingsScreen({super.key, this.onBackToHome});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final home = context.watch<HomeViewModel>();

    final user = auth.user;
    final userName = user?.name ?? user?.phone ?? 'Member';
    final userPhone = user?.phone ?? '';

    // Calculate contextual ownership counts across linked devices
    final devices = home.devices;
    final ownedCount = devices.where((d) => d.isOwner).length;
    final coOwnedCount = devices.where((d) => !d.isOwner).length;

    String accountScopeText = 'Standard Account';
    if (devices.isNotEmpty) {
      final List<String> parts = [];
      if (ownedCount > 0) parts.add('$ownedCount Owned');
      if (coOwnedCount > 0) parts.add('$coOwnedCount Co-Owned');
      accountScopeText = parts.join(' • ');
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 24, right: 24, top: 12, bottom: 85),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 700),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: < Settings
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.arrow_back_ios_new,
                        color: ParcelGlassColors.navyTitle,
                        size: 20,
                      ),
                      onPressed: onBackToHome ?? () => Navigator.maybePop(context),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Settings',
                      style: TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 25,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // User Profile & Account Summary Capsule (Zero Emojis)
              LiquidParcelCard(
                borderRadius: 22,
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: ParcelGlassColors.accentBlue.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: ParcelGlassColors.accentBlue.withValues(alpha: 0.35),
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            color: ParcelGlassColors.accentBlue,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: const TextStyle(
                              color: ParcelGlassColors.navyTitle,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          if (userPhone.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              userPhone,
                              style: const TextStyle(
                                color: ParcelGlassColors.slateSubtitle,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: ParcelGlassColors.accentBlue.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              accountScopeText.toUpperCase(),
                              style: const TextStyle(
                                color: ParcelGlassColors.accentBlue,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 1. Device & Network
              _buildSettingCapsule(
                context: context,
                icon: Icons.wifi,
                title: 'Device & Network',
                subtitle: 'Wi-Fi, Bluetooth, Device Info',
                onTap: () => NetworkHostDialog.show(context),
              ),

              // 2. Notification Preferences
              _buildSettingCapsule(
                context: context,
                icon: Icons.notifications_none_outlined,
                title: 'Notification Preferences',
                subtitle: 'Parcel, System, Security',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Push notifications are active for deliveries and door alerts.')),
                  );
                },
              ),

              // 3. Security
              _buildSettingCapsule(
                context: context,
                icon: Icons.shield_outlined,
                title: 'Security',
                subtitle: 'PIN, Access, Lock Settings',
                onTap: () {
                  _showSecurityModal(context);
                },
              ),

              // 4. Delivery Preferences
              _buildSettingCapsule(
                context: context,
                icon: Icons.inventory_2_outlined,
                title: 'Delivery Preferences',
                subtitle: 'Time, Instructions',
                onTap: () {
                  _showDeliveryInstructionsModal(context);
                },
              ),

              // 5. About
              _buildSettingCapsule(
                context: context,
                icon: Icons.info_outline,
                title: 'About',
                subtitle: 'App Version, Terms, Privacy',
                onTap: () {
                  _showAboutModal(context);
                },
              ),

              const SizedBox(height: 8),

              // 6. Log Out Button (Red Arrow & Red Text)
              LiquidParcelCard(
                isDestructive: true,
                borderRadius: 22,
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.symmetric(vertical: 14),
                onTap: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                  }
                },
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.logout,
                      color: ParcelGlassColors.alertRed,
                      size: 19,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Log Out',
                      style: TextStyle(
                        color: ParcelGlassColors.alertRed,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingCapsule({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return LiquidParcelCard(
      onTap: onTap,
      borderRadius: 22,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
      child: Row(
        children: [
          Icon(
            icon,
            color: ParcelGlassColors.accentBlue,
            size: 22,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: ParcelGlassColors.navyTitle,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: ParcelGlassColors.slateSubtitle,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right,
            color: ParcelGlassColors.slateSubtitle,
            size: 20,
          ),
        ],
      ),
    );
  }

  void _showSecurityModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: LiquidParcelCard(
          borderRadius: 28,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'SECURITY & ACCESS',
                    style: TextStyle(
                      color: ParcelGlassColors.navyTitle,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: ParcelGlassColors.slateSubtitle),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                '• Solenoid Lock Timeout: 15 Seconds (Auto-Latch)',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Door Tamper Watchdog: Armed',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Multi-Owner Slot Capacity: 2 / 5 active co-owners',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
              ),
              const SizedBox(height: 18),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeliveryInstructionsModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: LiquidParcelCard(
          borderRadius: 28,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'DELIVERY PREFERENCES',
                    style: TextStyle(
                      color: ParcelGlassColors.navyTitle,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: ParcelGlassColors.slateSubtitle),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Standard Courier Note:',
                style: TextStyle(color: ParcelGlassColors.navyTitle, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 4),
              const Text(
                '"Please place all delivery packages inside the Secure Box smart locker and press the latch down until you hear the confirmation click."',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontStyle: FontStyle.italic, fontSize: 13),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showAboutModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ParcelGlassColors.kraftCanvas,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Secure Box App',
          style: TextStyle(color: ParcelGlassColors.navyTitle, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('App Version: 1.0.0 (Release 2026)', style: TextStyle(color: ParcelGlassColors.slateSubtitle)),
            const SizedBox(height: 6),
            const Text('Locker Firmware: ESP32-WROOM v2.4', style: TextStyle(color: ParcelGlassColors.slateSubtitle)),
            const SizedBox(height: 6),
            Text('Server: ${AppConfig.currentHost}', style: const TextStyle(color: ParcelGlassColors.slateSubtitle)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK', style: TextStyle(color: ParcelGlassColors.navyTitle, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
