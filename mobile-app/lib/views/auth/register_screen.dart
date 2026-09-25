import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/auth_view_model.dart';
import '../widgets/glass_theme.dart';
import 'widgets/auth_top_bar.dart';
import 'widgets/register_credentials_step.dart';
import 'widgets/register_phone_otp_step.dart';

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
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return ParcelGlassScaffold(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              // Top Bar: Wi-Fi Server Indicator
              AuthTopBar(
                onHostChanged: () => setState(() {}),
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

                    RegisterPhoneOtpStep(
                      phoneController: _phoneController,
                      otpSent: _otpSent,
                      auth: auth,
                      onSendOtp: () => _handleSendOtp(auth),
                    ),

                    if (_otpSent)
                      RegisterCredentialsStep(
                        otpController: _otpController,
                        nameController: _nameController,
                        passwordController: _passwordController,
                        inviteCodeController: _inviteCodeController,
                        auth: auth,
                        onRegister: () => _handleRegister(auth),
                      ),
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
