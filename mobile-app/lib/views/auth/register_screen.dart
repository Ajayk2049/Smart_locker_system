import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/auth_view_model.dart';

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

    // Smart Pre-Check: User already exists!
    if (result['exists'] == true) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Account Already Exists'),
          content: Text(result['error'] ?? 'An account with this mobile number already exists. Please log in instead.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacementNamed(context, '/login');
              },
              child: const Text('Go to Login'),
            ),
          ],
        ),
      );
      return;
    }

    if (result['success'] == true) {
      setState(() {
        _otpSent = true;
        _infoMessage = result['message'] ?? 'OTP sent successfully!';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_infoMessage!)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'] ?? 'Failed to send OTP')),
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

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Secure Box',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create account with Mobile OTP',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 32),
                if (auth.error != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      auth.error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),

                // 1. Mobile Number & Get OTP Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 6,
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        enabled: !_otpSent,
                        decoration: const InputDecoration(
                          labelText: 'Mobile Number',
                          hintText: '10-digit phone',
                          prefixText: '+91 ',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: auth.loading || _otpSent
                              ? null
                              : () => _handleSendOtp(auth),
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          child: const Text('Get OTP'),
                        ),
                      ),
                    ),
                  ],
                ),

                // 2. OTP, Password, Name, and Join Code (Visible once OTP is dispatched)
                if (_otpSent) ...[
                  const SizedBox(height: 16),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Enter 6-Digit OTP',
                      hintText: '123456',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name (Optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Create Password',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _inviteCodeController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Join Code (Optional)',
                      hintText: 'e.g. SBX-79A2',
                      border: OutlineInputBorder(),
                      helperText: 'Have an invite code from a family member? Enter it here.',
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: auth.loading ? null : () => _handleRegister(auth),
                      child: auth.loading
                          ? const CircularProgressIndicator()
                          : const Text('Create Account'),
                    ),
                  ),
                ],

                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Already have an account? Sign in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
