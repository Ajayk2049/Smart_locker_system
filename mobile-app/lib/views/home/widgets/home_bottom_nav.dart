import 'package:flutter/material.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';
import '../../widgets/glass_theme.dart';

class HomeBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  const HomeBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
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
        selectedIndex: selectedIndex,
        onChanged: onChanged,
        pillStyle: LiquidGlassTabPillStyle(
          mode: LiquidGlassPillMode.both,
          color: ParcelGlassColors.accentBlue.withValues(alpha: 0.16),
          animated: false,
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
}
