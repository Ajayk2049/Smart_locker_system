import 'package:flutter/material.dart';
import '../../../view_models/auth_view_model.dart';
import '../../widgets/glass_theme.dart';

class RegisterPhoneOtpStep extends StatelessWidget {
  final TextEditingController phoneController;
  final bool otpSent;
  final AuthViewModel auth;
  final VoidCallback onSendOtp;

  const RegisterPhoneOtpStep({
    super.key,
    required this.phoneController,
    required this.otpSent,
    required this.auth,
    required this.onSendOtp,
  });

  @override
  Widget build(BuildContext context) {
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'MOBILE NUMBER',
          style: TextStyle(
            color: secondaryTextColor,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 6,
              child: TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                enabled: !otpSent,
                style: TextStyle(
                  color: primaryTextColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                decoration: InputDecoration(
                  hintText: '10-digit number',
                  hintStyle: TextStyle(
                    color: secondaryTextColor.withValues(alpha: 0.5),
                    fontSize: 13,
                  ),
                  prefixText: '+91 ',
                  prefixStyle: TextStyle(
                    color: primaryTextColor,
                    fontWeight: FontWeight.bold,
                  ),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.65),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: Colors.black12,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: ParcelGlassColors.mintSignal,
                      width: 1.8,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 4,
              child: SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: auth.loading || otpSent ? null : onSendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: otpSent
                        ? Colors.black12
                        : ParcelGlassColors.mintSignal,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    otpSent ? 'SENT ✓' : 'GET OTP',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
