import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';
import 'glass_theme.dart';

class AddLockerDialog extends StatefulWidget {
  const AddLockerDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AddLockerDialog(),
    );
  }

  @override
  State<AddLockerDialog> createState() => _AddLockerDialogState();
}

class _AddLockerDialogState extends State<AddLockerDialog> {
  int _selectedTab = 0; // 0: Hardware Device Code, 1: Family Join Code

  final _deviceIdController = TextEditingController();
  final _nameController = TextEditingController(text: 'Front Door Locker');
  final _joinCodeController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _deviceIdController.dispose();
    _nameController.dispose();
    _joinCodeController.dispose();
    super.dispose();
  }

  Future<void> _submitDeviceCode() async {
    final deviceId = _deviceIdController.text.trim().toUpperCase();
    final name = _nameController.text.trim();

    if (deviceId.isEmpty) {
      setState(() => _errorMessage = 'Please enter your Locker Device Code (e.g. BOX_001)');
      return;
    }
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter a name for your locker');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await context.read<HomeViewModel>().pairNewDevice(deviceId, name);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Locker "$deviceId" successfully linked to your account!'),
            backgroundColor: ParcelGlassColors.mintSignal,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  Future<void> _submitJoinCode() async {
    final joinCode = _joinCodeController.text.trim().toUpperCase();
    if (joinCode.isEmpty) {
      setState(() => _errorMessage = 'Please enter the 6-character Join Code');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await context.read<HomeViewModel>().joinDeviceViaCode(joinCode);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Joined locker successfully!'),
            backgroundColor: ParcelGlassColors.mintSignal,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = ParcelGlassColors.textPrimary(context);
    final secondaryTextColor = ParcelGlassColors.textSecondary(context);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 12,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: LiquidParcelCard(
            borderRadius: 22,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: ParcelGlassColors.amberSignal.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.add_box_rounded,
                            color: ParcelGlassColors.amberSignal,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'ADD A LOCKER',
                          style: TextStyle(
                            color: primaryTextColor,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: secondaryTextColor, size: 20),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Tab Selector: Hardware Device Code vs Family Join Code
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.black.withValues(alpha: 0.35)
                        : const Color(0xFF3D2310).withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _selectedTab = 0;
                            _errorMessage = null;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 7),
                            decoration: BoxDecoration(
                              color: _selectedTab == 0
                                  ? (isDark
                                      ? const Color(0xFF3D2310)
                                      : Colors.white)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                              boxShadow: _selectedTab == 0
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.08),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      )
                                    ]
                                  : null,
                            ),
                            child: Center(
                              child: Text(
                                '📦 Device Code',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: _selectedTab == 0
                                      ? FontWeight.w900
                                      : FontWeight.w600,
                                  color: _selectedTab == 0
                                      ? (_selectedTab == 0 && !isDark
                                          ? const Color(0xFF1E150F)
                                          : Colors.white)
                                      : secondaryTextColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _selectedTab = 1;
                            _errorMessage = null;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 7),
                            decoration: BoxDecoration(
                              color: _selectedTab == 1
                                  ? (isDark
                                      ? const Color(0xFF3D2310)
                                      : Colors.white)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                              boxShadow: _selectedTab == 1
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.08),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      )
                                    ]
                                  : null,
                            ),
                            child: Center(
                              child: Text(
                                '🔑 Join Code',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: _selectedTab == 1
                                      ? FontWeight.w900
                                      : FontWeight.w600,
                                  color: _selectedTab == 1
                                      ? (_selectedTab == 1 && !isDark
                                          ? const Color(0xFF1E150F)
                                          : Colors.white)
                                      : secondaryTextColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // Tab 0: Hardware Device Code (BOX_001, etc.)
                if (_selectedTab == 0) ...[
                  Text(
                    'Enter the Device Code from your locker sticker:',
                    style: TextStyle(color: secondaryTextColor, fontSize: 12),
                  ),
                  const SizedBox(height: 8),

                  // Device ID field
                  TextField(
                    controller: _deviceIdController,
                    textCapitalization: TextCapitalization.characters,
                    style: TextStyle(
                      color: primaryTextColor,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      letterSpacing: 1.2,
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      labelText: 'DEVICE CODE / ID',
                      labelStyle: TextStyle(color: secondaryTextColor, fontSize: 11),
                      hintText: 'e.g. BOX_001',
                      hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5), fontSize: 12),
                      prefixIcon: const Icon(Icons.qr_code_2, color: ParcelGlassColors.amberSignal, size: 20),
                      filled: true,
                      fillColor: isDark
                          ? Colors.black.withValues(alpha: 0.35)
                          : Colors.white.withValues(alpha: 0.6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white24 : Colors.black12,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: ParcelGlassColors.amberSignal,
                          width: 1.6,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Locker friendly name
                  TextField(
                    controller: _nameController,
                    style: TextStyle(
                      color: primaryTextColor,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      labelText: 'LOCKER NICKNAME',
                      labelStyle: TextStyle(color: secondaryTextColor, fontSize: 11),
                      hintText: 'e.g. Front Door Locker',
                      hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5), fontSize: 12),
                      prefixIcon: const Icon(Icons.label_outline, color: ParcelGlassColors.mintSignal, size: 20),
                      filled: true,
                      fillColor: isDark
                          ? Colors.black.withValues(alpha: 0.35)
                          : Colors.white.withValues(alpha: 0.6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white24 : Colors.black12,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: ParcelGlassColors.mintSignal,
                          width: 1.6,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    height: 42,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ParcelGlassColors.mintSignal,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: _isSubmitting ? null : _submitDeviceCode,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Icon(Icons.check_circle_outline, size: 18),
                      label: Text(
                        _isSubmitting ? 'LINKING...' : 'LINK LOCKER',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.8),
                      ),
                    ),
                  ),
                ] else ...[
                  // Tab 1: Family Join Code (SBX-XXXX)
                  Text(
                    'Enter the 6-character code shared by the locker owner:',
                    style: TextStyle(color: secondaryTextColor, fontSize: 12),
                  ),
                  const SizedBox(height: 8),

                  TextField(
                    controller: _joinCodeController,
                    textCapitalization: TextCapitalization.characters,
                    style: TextStyle(
                      color: primaryTextColor,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      letterSpacing: 2.5,
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      labelText: 'CO-OWNER JOIN CODE',
                      labelStyle: TextStyle(color: secondaryTextColor, fontSize: 11),
                      hintText: 'e.g. SBX-79A2',
                      hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.5), fontSize: 12),
                      prefixIcon: const Icon(Icons.vpn_key, color: ParcelGlassColors.mintSignal, size: 20),
                      filled: true,
                      fillColor: isDark
                          ? Colors.black.withValues(alpha: 0.35)
                          : Colors.white.withValues(alpha: 0.6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark ? Colors.white24 : Colors.black12,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: ParcelGlassColors.mintSignal,
                          width: 1.6,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    height: 42,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ParcelGlassColors.mintSignal,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: _isSubmitting ? null : _submitJoinCode,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Icon(Icons.link_rounded, size: 18),
                      label: Text(
                        _isSubmitting ? 'JOINING...' : 'JOIN AS CO-OWNER',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.8),
                      ),
                    ),
                  ),
                ],

                if (_errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: ParcelGlassColors.alertRose.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: ParcelGlassColors.alertRose.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, size: 15, color: ParcelGlassColors.alertRose),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: ParcelGlassColors.alertRose,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
