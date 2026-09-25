import 'package:flutter/material.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';
import '../glass_theme.dart';

class DeviceCodeTabView extends StatelessWidget {
  final TextEditingController deviceIdController;
  final TextEditingController nameController;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  const DeviceCodeTabView({
    super.key,
    required this.deviceIdController,
    required this.nameController,
    required this.isSubmitting,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Device ID field
        SizedBox(
          height: 52,
          child: TextField(
            controller: deviceIdController,
            textCapitalization: TextCapitalization.characters,
            style: TextStyle(
              color: primaryTextColor,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              hintText: 'e.g. BOX_001',
              hintStyle: TextStyle(
                color: secondaryTextColor.withValues(alpha: 0.55),
                fontSize: 13.5,
              ),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.35),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.60),
                  width: 1.2,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.60),
                  width: 1.2,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: ParcelGlassColors.accentBlue,
                  width: 1.8,
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 14),

        // Name field
        SizedBox(
          height: 52,
          child: TextField(
            controller: nameController,
            style: TextStyle(color: primaryTextColor, fontSize: 14),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              hintText: 'e.g. Front Door Locker',
              hintStyle: TextStyle(
                color: secondaryTextColor.withValues(alpha: 0.55),
                fontSize: 13.5,
              ),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.35),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.60),
                  width: 1.2,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.60),
                  width: 1.2,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: ParcelGlassColors.accentBlue,
                  width: 1.8,
                ),
              ),
            ),
          ),
        ),

        const Spacer(),

        // Link Locker Liquid Glass Button
        LiquidGlassButton(
          label: 'LINK LOCKER',
          icon: Icons.link_rounded,
          height: 48,
          width: double.infinity,
          foregroundColor: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 13.5,
          style: LiquidGlassButton.defaultStyle.copyWith(
            shape: const LiquidGlassShape.continuousRoundedRectangle(
              cornerRadius: 14,
              borderWidth: 1.2,
              borderColor: Color(0x80FFFFFF),
            ),
            appearance: LiquidGlassAppearance(
              color: ParcelGlassColors.accentBlue.withValues(alpha: 0.88),
              blur: const LiquidGlassBlur(sigmaX: 12, sigmaY: 12),
            ),
            refraction: const LiquidGlassRefraction(
              distortion: 0.12,
              distortionWidth: 20,
            ),
          ),
          onPressed: isSubmitting ? null : onSubmit,
          child: isSubmitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : null,
        ),
      ],
    );
  }
}
