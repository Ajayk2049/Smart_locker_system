import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/device.model.dart';
import '../../services/api_service.dart';
import '../../view_models/auth_view_model.dart';
import '../../view_models/home_view_model.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';
import '../settings/settings_screen.dart';
import '../widgets/add_locker_dialog.dart';
import '../widgets/glass_theme.dart';
import '../widgets/liquid_slide_to_unlock.dart';
import '../widgets/parcel_history_tile.dart';

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
                            SnackBar(
                              content: const Text('Join code copied to clipboard!'),
                              behavior: SnackBarBehavior.floating,
                              margin: const EdgeInsets.only(bottom: 100, left: 20, right: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
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
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.only(bottom: 100, left: 20, right: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
                Expanded(
                  child: Text('${device.deviceId} - Door opened.'),
                ),
              ],
            ),
            backgroundColor: ParcelGlassColors.accentBlue,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.only(bottom: 100, left: 20, right: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
            margin: const EdgeInsets.only(bottom: 100, left: 20, right: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
      child: Stack(
        children: [
          SafeArea(
            child: IndexedStack(
              index: _currentTab,
              children: [
                RepaintBoundary(child: _buildHomeTab()),
                RepaintBoundary(child: _buildHistoryTab()),
                RepaintBoundary(
                  child: SettingsScreen(onBackToHome: () => setState(() => _currentTab = 0)),
                ),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: RepaintBoundary(
                child: _buildLiquidBottomNav(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiquidBottomNav() {
    return Center(
      child: LiquidGlassTabBar(
        items: const [
          LiquidGlassTabBarItem(
            icon: Icons.home_outlined,
            selectedIcon: Icons.home_rounded,
            label: 'Home',
          ),
          LiquidGlassTabBarItem(
            icon: Icons.access_time_outlined,
            selectedIcon: Icons.access_time_filled,
            label: 'History',
          ),
          LiquidGlassTabBarItem(
            icon: Icons.settings_outlined,
            selectedIcon: Icons.settings,
            label: 'Settings',
          ),
        ],
        selectedIndex: _currentTab,
        onChanged: (index) {
          setState(() => _currentTab = index);
          if (index == 1) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              final homeVM = context.read<HomeViewModel>();
              final devId = homeVM.selectedDevice?.deviceId ??
                  (homeVM.devices.isNotEmpty ? homeVM.devices.first.deviceId : null);
              if (devId != null) {
                homeVM.fetchDeviceLogs(devId);
              }
            });
          }
        },
        pillStyle: LiquidGlassTabPillStyle(
          mode: LiquidGlassPillMode.both,
          color: ParcelGlassColors.accentBlue.withValues(alpha: 0.16),
          animated: true,
        ),
        itemStyle: const LiquidGlassTabItemStyle(
          selectedColor: ParcelGlassColors.accentBlue,
          unselectedColor: ParcelGlassColors.slateSubtitle,
          iconSize: 22,
          labelFontSize: 11,
          selectedFontWeight: FontWeight.w800,
          unselectedFontWeight: FontWeight.w600,
        ),
        width: 320,
        height: 64,
        margin: const EdgeInsets.only(bottom: 16),
      ),
    );
  }

  Widget _buildUserGreeting(String userName, bool showAddButton) {
    return Row(
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
        const Spacer(),
        if (showAddButton)
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: ParcelGlassColors.accentBlue, size: 26),
            tooltip: 'Add Locker',
            onPressed: () => _showAddLocker(context),
          ),
      ],
    );
  }

  Widget _buildHomeTab() {
    final authVM = context.watch<AuthViewModel>();
    final homeVM = context.watch<HomeViewModel>();

    final currentUser = authVM.user;
    final userName = currentUser?.name ?? currentUser?.phone ?? 'User';
    final devices = homeVM.devices;

    if (devices.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(left: 18, right: 18, top: 12, bottom: 95),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight - 107),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildUserGreeting(userName, false),

                  if (homeVM.loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: CircularProgressIndicator(color: ParcelGlassColors.accentBlue),
                      ),
                    )
                  else
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 380),
                        child: LiquidParcelCard(
                          borderRadius: 24,
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
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
                      ),
                    ),

                  const SizedBox(height: 10),
                ],
              ),
            ),
          );
        },
      );
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 18, right: 18, top: 12, bottom: 95),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildUserGreeting(userName, true),
          const SizedBox(height: 16),
          for (final device in devices) ...[
            _buildLockerHeroCard(device),
            const SizedBox(height: 12),
          ],
        ],
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
                  Row(
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
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: (device.isOwner ? ParcelGlassColors.mintSignal : ParcelGlassColors.accentBlue).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          device.isOwner ? 'OWNER' : 'CO-OWNER',
                          style: TextStyle(
                            color: device.isOwner ? const Color(0xFF047857) : ParcelGlassColors.accentBlue,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
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
            isUnlocked: isDoorOpen,
            onUnlock: () => _handleUnlock(device),
          ),

          // Co-Owner invite action (Owner only)
          if (device.isOwner) ...[
            const SizedBox(height: 12),
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
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    final home = context.watch<HomeViewModel>();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 95),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
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
