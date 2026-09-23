import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config.dart';
import '../../view_models/auth_view_model.dart';
import '../../view_models/theme_view_model.dart';
import '../widgets/glass_theme.dart';
import '../widgets/network_host_dialog.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _inviteCodeController = TextEditingController();

  bool _otpSent = false;
  String? _infoMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _inviteCodeController.dispose();
    super.dispose();
  }

  void _handleSendOtp(AuthViewModel auth) async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty || phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number')),
      );
      return;
    }

    final result = await auth.sendOtp(phone);

    if (!mounted) return;

    if (result['exists'] == true) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Account Already Exists', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text(
            result['error'] ?? 'An account with this mobile number already exists. Please sign in instead.',
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ParcelGlassColors.mintSignal,
                foregroundColor: Colors.black,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacementNamed(context, '/login');
              },
              child: const Text('Go to Sign In', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    if (result['success'] == true) {
      setState(() {
        _otpSent = true;
        _infoMessage = result['message'] ?? 'OTP verification code sent!';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_infoMessage!),
          backgroundColor: ParcelGlassColors.amberSignal,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error'] ?? 'Failed to send OTP'),
          backgroundColor: ParcelGlassColors.alertRose,
        ),
      );
    }
  }

  void _handleRegister(AuthViewModel auth) async {
    final success = await auth.registerWithOtp(
      phone: _phoneController.text.trim(),
      otp: _otpController.text.trim(),
      password: _passwordController.text,
      name: _nameController.text.trim(),
      inviteCode: _inviteCodeController.text.trim(),
    );

    if (success && mounted) {
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final themeVM = context.watch<ThemeViewModel>();
    final isDark = themeVM.isDark;
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return ParcelGlassScaffold(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              // Top Bar: Theme Switcher + Wi-Fi Server Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => themeVM.toggleTheme(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.black.withValues(alpha: 0.4)
                            : Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? Colors.white24 : Colors.black12,
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isDark ? Icons.light_mode : Icons.dark_mode,
                            size: 15,
                            color: isDark ? ParcelGlassColors.amberSignal : const Color(0xFF3D2310),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isDark ? 'LIGHT' : 'DARK',
                            style: TextStyle(
                              color: primaryTextColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => NetworkHostDialog.show(context).then((_) => setState(() {})),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.black.withValues(alpha: 0.4)
                            : Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: ParcelGlassColors.mintSignal.withValues(alpha: 0.4),
                          width: 1.2,
                        ),
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
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.settings, color: secondaryTextColor, size: 14),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              Text(
                'SECURE BOX',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: primaryTextColor,
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Member Registration & Locker Access',
                style: TextStyle(color: secondaryTextColor, fontSize: 13),
              ),

              const SizedBox(height: 24),

              // Registration Glass Card
              LiquidParcelCard(
                borderRadius: 24,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CREATE ACCOUNT',
                      style: TextStyle(
                        color: primaryTextColor,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (auth.error != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: ParcelGlassColors.alertRose.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: ParcelGlassColors.alertRose.withValues(alpha: 0.35)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: ParcelGlassColors.alertRose, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                auth.error!,
                                style: const TextStyle(
                                  color: ParcelGlassColors.alertRose,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Phone row with Get OTP button
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
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            enabled: !_otpSent,
                            style: TextStyle(color: primaryTextColor, fontSize: 14, fontWeight: FontWeight.w600),
                            decoration: InputDecoration(
                              hintText: '10-digit number',
                              hintStyle: TextStyle(
                                color: secondaryTextColor.withValues(alpha: 0.5),
                                fontSize: 13,
                              ),
                              prefixText: '+91 ',
                              prefixStyle: TextStyle(color: primaryTextColor, fontWeight: FontWeight.bold),
                              filled: true,
                              fillColor: isDark
                                  ? Colors.black.withValues(alpha: 0.35)
                                  : Colors.white.withValues(alpha: 0.65),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(
                                  color: isDark ? Colors.white12 : Colors.black12,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(color: ParcelGlassColors.mintSignal, width: 1.8),
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
                              onPressed: auth.loading || _otpSent ? null : () => _handleSendOtp(auth),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _otpSent
                                    ? (isDark ? Colors.white24 : Colors.black12)
                                    : ParcelGlassColors.mintSignal,
                                foregroundColor: Colors.black,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: Text(
                                _otpSent ? 'SENT ✓' : 'GET OTP',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    if (_otpSent) ...[
                      const SizedBox(height: 16),
                      Text(
                        'ENTER 6-DIGIT OTP',
                        style: TextStyle(
                          color: secondaryTextColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        style: TextStyle(
                          color: primaryTextColor,
                          fontSize: 16,
                          fontFamily: 'monospace',
                          letterSpacing: 3.0,
                          fontWeight: FontWeight.bold,
                        ),
                        decoration: InputDecoration(
                          hintText: '123456',
                          hintStyle: TextStyle(
                            color: secondaryTextColor.withValues(alpha: 0.4),
                            letterSpacing: 3.0,
                          ),
                          filled: true,
                          fillColor: isDark
                              ? Colors.black.withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.65),
                          prefixIcon: Icon(Icons.pin, color: secondaryTextColor, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: ParcelGlassColors.mintSignal, width: 1.8),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      Text(
                        'FULL NAME',
                        style: TextStyle(
                          color: secondaryTextColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _nameController,
                        style: TextStyle(color: primaryTextColor, fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: InputDecoration(
                          hintText: 'e.g. Rahul Sharma',
                          hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5)),
                          filled: true,
                          fillColor: isDark
                              ? Colors.black.withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.65),
                          prefixIcon: Icon(Icons.person_outline, color: secondaryTextColor, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: ParcelGlassColors.mintSignal, width: 1.8),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      Text(
                        'CREATE PASSWORD',
                        style: TextStyle(
                          color: secondaryTextColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: TextStyle(color: primaryTextColor, fontSize: 14, fontWeight: FontWeight.w600),
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5)),
                          filled: true,
                          fillColor: isDark
                              ? Colors.black.withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.65),
                          prefixIcon: Icon(Icons.lock_outline, color: secondaryTextColor, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: ParcelGlassColors.mintSignal, width: 1.8),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),
                      Text(
                        'JOIN CODE (OPTIONAL)',
                        style: TextStyle(
                          color: secondaryTextColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _inviteCodeController,
                        textCapitalization: TextCapitalization.characters,
                        style: TextStyle(
                          color: primaryTextColor,
                          fontSize: 14,
                          fontFamily: 'monospace',
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.bold,
                        ),
                        decoration: InputDecoration(
                          hintText: 'e.g. SBX-79A2',
                          hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5)),
                          helperText: 'Have a family invite code? Enter it to link immediately.',
                          helperStyle: TextStyle(color: secondaryTextColor, fontSize: 11),
                          filled: true,
                          fillColor: isDark
                              ? Colors.black.withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.65),
                          prefixIcon: Icon(Icons.vpn_key_outlined, color: secondaryTextColor, size: 18),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: ParcelGlassColors.mintSignal, width: 1.8),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ParcelGlassColors.accentBlue,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: auth.loading ? null : () => _handleRegister(auth),
                          child: auth.loading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black),
                                )
                              : const Text(
                                  'COMPLETE REGISTRATION',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                                ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              TextButton(
                onPressed: () => Navigator.pop(context),
                child: RichText(
                  text: TextSpan(
                    text: 'Already have an account? ',
                    style: TextStyle(color: secondaryTextColor, fontSize: 13),
                    children: const [
                      TextSpan(
                        text: 'Sign In',
                        style: TextStyle(color: ParcelGlassColors.mintSignal, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
