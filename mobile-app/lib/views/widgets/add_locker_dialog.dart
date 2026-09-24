import 'package:flutter/material.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';
import 'glass_theme.dart';

class AddLockerDialog extends StatefulWidget {
  const AddLockerDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showLiquidGlassDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withValues(alpha: 0.20),
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
      setState(() => _errorMessage = 'Please enter Device Code (e.g. BOX_001)');
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
            content: Text('Locker "$deviceId" linked!'),
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
    final joinCode = _joinCodeController.text.trim().toUpperCase().replaceAll(' ', '');
    if (joinCode.isEmpty) {
      setState(() => _errorMessage = 'Please enter Join Code');
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

    return LiquidGlassDialog(
      width: 350,
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
      style: LiquidGlassStyle(
        shape: const LiquidGlassShape.continuousRoundedRectangle(
          cornerRadius: 30,
          borderWidth: 1.4,
          borderColor: Color(0xCCFFFFFF),
        ),
        appearance: LiquidGlassAppearance(
          color: isDark
              ? const Color(0x731E1610)
              : const Color(0x66FFFFFF),
          blur: const LiquidGlassBlur(sigmaX: 20, sigmaY: 20),
          shadow: const LiquidGlassShadow(
            blur: 28,
            opacity: 0.16,
            color: Color(0xFF3D2310),
            offset: Offset(0, 10),
          ),
        ),
        refraction: const LiquidGlassRefraction(
          distortion: 0.14,
          distortionWidth: 32,
          chromaticAberration: 0.003,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: ParcelGlassColors.amberSignal.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.add_box_rounded,
                  color: ParcelGlassColors.amberSignal,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ADD LOCKER',
                  style: TextStyle(
                    color: primaryTextColor,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: secondaryTextColor, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // LiquidGlassTabBar for tabs (pure text: Device Code & Join Code)
          Center(
            child: LiquidGlassTabBar(
              width: 300,
              height: 44,
              margin: EdgeInsets.zero,
              alignment: Alignment.center,
              items: [
                LiquidGlassTabBarItem(
                  label: 'Device Code',
                  iconBuilder: (_, __) => const SizedBox.shrink(),
                ),
                LiquidGlassTabBarItem(
                  label: 'Join Code',
                  iconBuilder: (_, __) => const SizedBox.shrink(),
                ),
              ],
              selectedIndex: _selectedTab,
              onChanged: (index) => setState(() {
                _selectedTab = index;
                _errorMessage = null;
              }),
              pillStyle: LiquidGlassTabPillStyle(
                mode: LiquidGlassPillMode.both,
                color: ParcelGlassColors.accentBlue.withValues(alpha: 0.18),
                animated: true,
              ),
              itemStyle: const LiquidGlassTabItemStyle(
                selectedColor: ParcelGlassColors.accentBlue,
                unselectedColor: ParcelGlassColors.slateSubtitle,
                iconSize: 0,
                underGlassIconSize: 0,
                iconLabelGap: 0,
                labelFontSize: 13,
                selectedFontWeight: FontWeight.w800,
                unselectedFontWeight: FontWeight.w600,
              ),
              style: LiquidGlassStyle(
                shape: const LiquidGlassShape.continuousRoundedRectangle(
                  cornerRadius: 22,
                  borderWidth: 1.0,
                  borderColor: Color(0x40FFFFFF),
                ),
                appearance: LiquidGlassAppearance(
                  color: Colors.white.withValues(alpha: 0.20),
                  blur: const LiquidGlassBlur(sigmaX: 8, sigmaY: 8),
                ),
              ),
            ),
          ),

          const SizedBox(height: 18),

          SizedBox(
            height: 200,
            child: _selectedTab == 0
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Device ID field
                      SizedBox(
                        height: 52,
                        child: TextField(
                          controller: _deviceIdController,
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
                            hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.55), fontSize: 13.5),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.35),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: ParcelGlassColors.accentBlue, width: 1.8),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Name field
                      SizedBox(
                        height: 52,
                        child: TextField(
                          controller: _nameController,
                          style: TextStyle(color: primaryTextColor, fontSize: 14),
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                            hintText: 'e.g. Front Door Locker',
                            hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.55), fontSize: 13.5),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.35),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: ParcelGlassColors.accentBlue, width: 1.8),
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
                        onPressed: _isSubmitting ? null : _submitDeviceCode,
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : null,
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Join Code field
                      SizedBox(
                        height: 52,
                        child: TextField(
                          controller: _joinCodeController,
                          textCapitalization: TextCapitalization.characters,
                          style: TextStyle(
                            color: primaryTextColor,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                            letterSpacing: 2.0,
                          ),
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                            hintText: 'e.g. SBX-79A2',
                            hintStyle: TextStyle(color: secondaryTextColor.withValues(alpha: 0.55), fontSize: 13.5, letterSpacing: 0),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.35),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.60), width: 1.2),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: ParcelGlassColors.accentBlue, width: 1.8),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      Text(
                        'Enter the 6-character invite code to join this locker as a co-owner.',
                        style: TextStyle(
                          color: secondaryTextColor.withValues(alpha: 0.75),
                          fontSize: 12.5,
                          height: 1.3,
                        ),
                      ),

                      const Spacer(),

                      // Join As Co-Owner Liquid Glass Button
                      LiquidGlassButton(
                        label: 'JOIN AS CO-OWNER',
                        icon: Icons.group_add_rounded,
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
                        onPressed: _isSubmitting ? null : _submitJoinCode,
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : null,
                      ),
                    ],
                  ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: ParcelGlassColors.alertRose,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
