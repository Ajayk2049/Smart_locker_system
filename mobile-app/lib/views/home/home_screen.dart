import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config.dart';
import '../../models/device.model.dart';
import '../../services/api_service.dart';
import '../../view_models/auth_view_model.dart';
import '../../view_models/home_view_model.dart';
import '../settings/settings_screen.dart';
import '../widgets/add_locker_dialog.dart';
import '../widgets/glass_theme.dart';
import '../widgets/liquid_slide_to_unlock.dart';
import '../widgets/network_host_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  int _currentTab = 0; // 0: Home, 1: History, 2: Settings
  bool _isUnlocking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeViewModel>().init();
    });
  }

  void _showAddLocker(BuildContext context) {
    AddLockerDialog.show(context);
  }

  void _showInviteSheet(BuildContext context, String deviceId, String deviceName) async {
    try {
      final res = await _api.createInviteCode(deviceId);
      final inviteCode = res['inviteCode'] ?? '';

      if (!context.mounted) return;

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
                    Text(
                      'INVITE CO-OWNER: $deviceName',
                      style: const TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.1,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: ParcelGlassColors.slateSubtitle),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Share this single-use code with your family member or flatmate. Valid for 24 hours:',
                  style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: ParcelGlassColors.mintSignal.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        inviteCode,
                        style: const TextStyle(
                          fontSize: 26,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w900,
                          letterSpacing: 4.0,
                          color: ParcelGlassColors.accentBlue,
                        ),
                      ),
                      const SizedBox(width: 14),
                      IconButton(
                        icon: const Icon(Icons.copy, color: ParcelGlassColors.slateSubtitle),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: inviteCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Join code copied to clipboard!')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not generate invite: ${e.toString()}'),
            backgroundColor: ParcelGlassColors.alertRed,
          ),
        );
      }
    }
  }

  Future<void> _handleUnlock(DeviceModel device) async {
    setState(() => _isUnlocking = true);
    try {
      await context.read<HomeViewModel>().unlockDevice(device.deviceId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.lock_open, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Text('Solenoid unlock sent to ${device.deviceId}! Door opened.'),
              ],
            ),
            backgroundColor: ParcelGlassColors.accentBlue,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Unlock failed: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: ParcelGlassColors.alertRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUnlocking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ParcelGlassScaffold(
      bottomNavigationBar: _buildLiquidBottomNav(),
      child: SafeArea(
        child: IndexedStack(
          index: _currentTab,
          children: [
            _buildHomeTab(),
            _buildHistoryTab(),
            SettingsScreen(onBackToHome: () => setState(() => _currentTab = 0)),
          ],
        ),
      ),
    );
  }

  Widget _buildLiquidBottomNav() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 18),
      child: SizedBox(
        height: 70,
        child: LiquidParcelCard(
          borderRadius: 35,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          margin: EdgeInsets.zero,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.home_outlined,
                activeIcon: Icons.home_rounded,
                label: 'Home',
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.access_time_outlined,
                activeIcon: Icons.access_time_filled,
                label: 'History',
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.settings_outlined,
                activeIcon: Icons.settings,
                label: 'Settings',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = _currentTab == index;
    final color = isSelected ? ParcelGlassColors.accentBlue : ParcelGlassColors.slateSubtitle;

    return GestureDetector(
      onTap: () => setState(() => _currentTab = index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: color,
              size: 25,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeTab() {
    final authVM = context.watch<AuthViewModel>();
    final homeVM = context.watch<HomeViewModel>();

    final currentUser = authVM.user;
    final userName = currentUser?.name ?? currentUser?.phone ?? 'User';
    final devices = homeVM.devices;

    return RefreshIndicator(
      color: ParcelGlassColors.accentBlue,
      onRefresh: () async => homeVM.fetchDevices(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top App Bar: User Greeting + Quick Wi-Fi Pill
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
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
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName,
                          style: const TextStyle(
                            color: ParcelGlassColors.navyTitle,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                        ),
                        Text(
                          'Secure Box Member',
                          style: TextStyle(
                            color: ParcelGlassColors.slateSubtitle.withValues(alpha: 0.8),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => NetworkHostDialog.show(context).then((_) => setState(() {})),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: ParcelGlassColors.mintSignal.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: ParcelGlassColors.mintSignal,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          AppConfig.currentHost,
                          style: const TextStyle(
                            color: ParcelGlassColors.navyTitle,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Prominent "+ ADD LOCKER" Capsule Card
            LiquidParcelCard(
              onTap: () => _showAddLocker(context),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: ParcelGlassColors.accentBlue,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.add, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add / Link a Locker',
                          style: TextStyle(
                            color: ParcelGlassColors.navyTitle,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Enter Device Code (e.g. BOX_001) or Join Code',
                          style: TextStyle(
                            color: ParcelGlassColors.slateSubtitle,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: ParcelGlassColors.slateSubtitle),
                ],
              ),
            ),

            const SizedBox(height: 8),

            if (homeVM.loading && devices.isEmpty) ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 60),
                  child: CircularProgressIndicator(color: ParcelGlassColors.accentBlue),
                ),
              ),
            ] else if (devices.isEmpty) ...[
              // Empty State
              LiquidParcelCard(
                borderRadius: 24,
                padding: const EdgeInsets.all(28),
                child: Column(
                  children: [
                    const Icon(Icons.inventory_2_outlined, size: 48, color: ParcelGlassColors.accentBlue),
                    const SizedBox(height: 14),
                    const Text(
                      'No Lockers Linked',
                      style: TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Add your smart locker using the Hardware Device Code from your box sticker, or enter a Family Join Code.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ParcelGlassColors.accentBlue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        onPressed: () => _showAddLocker(context),
                        icon: const Icon(Icons.qr_code, size: 18),
                        label: const Text(
                          'ENTER DEVICE CODE',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Active Locker Hero Cards
              for (final device in devices) ...[
                _buildLockerHeroCard(device),
                const SizedBox(height: 12),
              ],
            ],

            const SizedBox(height: 80), // spacing above bottom nav
          ],
        ),
      ),
    );
  }

  Widget _buildLockerHeroCard(DeviceModel device) {
    final isOnline = device.online;
    final isDoorOpen = device.doorState.toLowerCase() == 'open';

    return LiquidParcelCard(
      borderRadius: 26,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Device Name & Online Indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name.isNotEmpty ? device.name : 'Secure Box',
                    style: const TextStyle(
                      color: ParcelGlassColors.navyTitle,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    device.deviceId,
                    style: const TextStyle(
                      color: ParcelGlassColors.slateSubtitle,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
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

          // Hardware Metrics: Door State + Solenoid Lock
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
            isUnlocking: _isUnlocking,
            isLockerOnline: isOnline,
            onUnlock: () => _handleUnlock(device),
          ),

          const SizedBox(height: 16),

          // Courier Daily OTP Pass
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'COURIER PASS (DAILY OTP)',
                      style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 10, fontWeight: FontWeight.w800),
                    ),
                    SizedBox(height: 2),
                    Text(
                      '# 482910',
                      style: TextStyle(
                        color: ParcelGlassColors.navyTitle,
                        fontSize: 22,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ParcelGlassColors.accentBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    Clipboard.setData(const ClipboardData(text: '482910'));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Delivery OTP copied to clipboard!')),
                    );
                  },
                  icon: const Icon(Icons.share, size: 14),
                  label: const Text('SHARE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Co-Owner invite action
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () => _showInviteSheet(context, device.deviceId, device.name),
              icon: const Icon(Icons.person_add_alt_1, size: 16, color: ParcelGlassColors.accentBlue),
              label: const Text(
                'Invite Family / Co-Owner',
                style: TextStyle(color: ParcelGlassColors.accentBlue, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    final home = context.watch<HomeViewModel>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            'Activity History',
            style: TextStyle(
              color: ParcelGlassColors.navyTitle,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: home.loading
              ? const Center(child: CircularProgressIndicator(color: ParcelGlassColors.accentBlue))
              : home.logs.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: LiquidParcelCard(
                          borderRadius: 24,
                          padding: const EdgeInsets.all(28),
                          child: const Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.history, size: 44, color: ParcelGlassColors.slateSubtitle),
                              SizedBox(height: 12),
                              Text(
                                'No Activity Recorded Yet',
                                style: TextStyle(
                                  color: ParcelGlassColors.navyTitle,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                'Door interactions and courier delivery events will appear here.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      itemCount: home.logs.length,
                      itemBuilder: (context, index) {
                        final log = home.logs[index];
                        return LiquidParcelCard(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: ParcelGlassColors.accentBlue.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.lock_open, color: ParcelGlassColors.accentBlue, size: 20),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      log.action.replaceAll('_', ' ').toUpperCase(),
                                      style: const TextStyle(
                                        color: ParcelGlassColors.navyTitle,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      '${log.timestamp.hour}:${log.timestamp.minute.toString().padLeft(2, '0')}',
                                      style: const TextStyle(
                                        color: ParcelGlassColors.slateSubtitle,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
