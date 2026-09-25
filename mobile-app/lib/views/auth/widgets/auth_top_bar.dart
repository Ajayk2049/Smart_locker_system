import 'package:flutter/material.dart';
import '../../../../config.dart';
import '../../widgets/glass_theme.dart';
import '../../widgets/network_host_dialog.dart';

class AuthTopBar extends StatelessWidget {
  final VoidCallback? onHostChanged;

  const AuthTopBar({
    super.key,
    this.onHostChanged,
  });

  @override
  Widget build(BuildContext context) {
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return Align(
      alignment: Alignment.centerRight,
      child: GestureDetector(
        onTap: () => NetworkHostDialog.show(context).then((_) => onHostChanged?.call()),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: ParcelGlassColors.mintSignal.withValues(alpha: 0.4),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: ParcelGlassColors.mintSignal,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                AppConfig.currentHost,
                style: TextStyle(
                  color: primaryTextColor,
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 6),
              Icon(Icons.settings, color: secondaryTextColor, size: 14),
            ],
          ),
        ),
      ),
    );
  }
}
