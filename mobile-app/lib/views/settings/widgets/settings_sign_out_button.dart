import 'package:flutter/material.dart';
import '../../widgets/glass_theme.dart';

class SettingsSignOutButton extends StatelessWidget {
  final VoidCallback onSignOut;

  const SettingsSignOutButton({
    super.key,
    required this.onSignOut,
  });

  @override
  Widget build(BuildContext context) {
    return LiquidParcelCard(
      isDestructive: true,
      borderRadius: 22,
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.symmetric(vertical: 14),
      onTap: onSignOut,
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
    );
  }
}
