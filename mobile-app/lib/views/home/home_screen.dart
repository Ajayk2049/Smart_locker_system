import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/device.model.dart';
import '../../view_models/auth_view_model.dart';
import '../../view_models/home_view_model.dart';
import '../settings/settings_screen.dart';
import '../widgets/add_locker_dialog.dart';
import '../widgets/glass_theme.dart';
import 'widgets/co_owner_invite_sheet.dart';
import 'widgets/home_bottom_nav.dart';
import 'widgets/home_empty_state.dart';
import 'widgets/home_history_tab.dart';
import 'widgets/home_user_greeting.dart';
import 'widgets/locker_hero_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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

  void _showInviteSheet(BuildContext context, String deviceId, String deviceName) {
    CoOwnerInviteSheet.show(context, deviceId, deviceName);
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
                const RepaintBoundary(child: HomeHistoryTab()),
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
                child: HomeBottomNav(
                  selectedIndex: _currentTab,
                  onChanged: (index) {
                    if (_currentTab == index) return;
                    setState(() => _currentTab = index);
                    if (index == 1) {
                      final homeVM = context.read<HomeViewModel>();
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (!mounted) return;
                        final devId = homeVM.selectedDevice?.deviceId ??
                            (homeVM.devices.isNotEmpty ? homeVM.devices.first.deviceId : null);
                        if (devId != null) {
                          homeVM.fetchDeviceLogs(devId);
                        }
                      });
                    }
                  },
                ),
              ),
            ),
          ),
        ],
      ),
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
                  HomeUserGreeting(
                    userName: userName,
                    showAddButton: false,
                    onAddLocker: () => _showAddLocker(context),
                  ),
                  HomeEmptyState(
                    loading: homeVM.loading,
                    onAddLocker: () => _showAddLocker(context),
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
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 700),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              HomeUserGreeting(
                userName: userName,
                showAddButton: true,
                onAddLocker: () => _showAddLocker(context),
              ),
              const SizedBox(height: 16),
              for (final device in devices) ...[
                LockerHeroCard(
                  device: device,
                  isUnlocking: _isUnlocking,
                  onUnlock: () => _handleUnlock(device),
                  onInviteCoOwner: () => _showInviteSheet(context, device.deviceId, device.name),
                ),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
