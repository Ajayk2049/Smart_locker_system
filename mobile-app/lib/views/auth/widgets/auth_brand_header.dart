import 'package:flutter/material.dart';
import '../../widgets/glass_theme.dart';

class AuthBrandHeader extends StatelessWidget {
  const AuthBrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: ParcelGlassColors.amberSignal,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: ParcelGlassColors.amberSignal.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(
            Icons.inventory_2,
            color: Colors.white,
            size: 38,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'SECURE BOX',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: primaryTextColor,
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Doorstep Smart Locker Key',
          style: TextStyle(
            color: secondaryTextColor,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
