import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_theme.dart';

class LiquidSlideToUnlock extends StatefulWidget {
  final Future<void> Function() onUnlock;
  final bool isUnlocking;
  final bool isLockerOnline;

  const LiquidSlideToUnlock({
    super.key,
    required this.onUnlock,
    this.isUnlocking = false,
    this.isLockerOnline = true,
  });

  @override
  State<LiquidSlideToUnlock> createState() => _LiquidSlideToUnlockState();
}

class _LiquidSlideToUnlockState extends State<LiquidSlideToUnlock> {
  double _dragProgress = 0.0;
  bool _triggered = false;

  void _onHorizontalDragUpdate(DragUpdateDetails details, double trackWidth) {
    if (widget.isUnlocking || !widget.isLockerOnline || _triggered) return;

    final usableWidth = trackWidth - 60; // thumb size 60
    if (usableWidth <= 0) return;

    setState(() {
      _dragProgress = (_dragProgress + details.delta.dx / usableWidth).clamp(0.0, 1.0);
    });

    if (_dragProgress >= 0.88 && !_triggered) {
      _triggered = true;
      HapticFeedback.heavyImpact();
      widget.onUnlock().whenComplete(() {
        if (mounted) {
          setState(() {
            _dragProgress = 0.0;
            _triggered = false;
          });
        }
      });
    }
  }

  void _onHorizontalDragEnd(DragEndDetails details) {
    if (_triggered) return;
    setState(() {
      _dragProgress = 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = ParcelGlassColors.textPrimary(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final trackWidth = constraints.maxWidth;
        const thumbSize = 56.0;
        final maxOffset = trackWidth - thumbSize - 8.0;
        final currentOffset = _dragProgress * maxOffset;

        return ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              color: isDark
                  ? const Color(0xFF1B130E).withValues(alpha: 0.65)
                  : Colors.black.withValues(alpha: 0.05),
              border: Border.all(
                color: widget.isLockerOnline
                    ? ParcelGlassColors.mintSignal.withValues(alpha: isDark ? 0.35 : 0.5)
                    : (isDark ? Colors.white12 : Colors.black12),
                width: 1.5,
              ),
            ),
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // Active fill bar that expands as user drags
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: currentOffset + thumbSize + 4,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(32),
                      gradient: LinearGradient(
                        colors: [
                          ParcelGlassColors.mintSignal.withValues(alpha: isDark ? 0.12 : 0.20),
                          ParcelGlassColors.mintSignal.withValues(alpha: isDark ? 0.40 : 0.50),
                        ],
                      ),
                    ),
                  ),
                ),

                // Center Label
                Center(
                  child: widget.isUnlocking
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                color: ParcelGlassColors.mintSignal,
                              ),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'OPENING SOLENOID LOCK...',
                              style: TextStyle(
                                color: ParcelGlassColors.mintSignal,
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        )
                      : Text(
                          widget.isLockerOnline
                              ? 'SLIDE TO UNLOCK DOOR ➔'
                              : 'LOCKER IS OFFLINE',
                          style: TextStyle(
                            color: widget.isLockerOnline
                                ? (isDark
                                    ? Colors.white.withValues(alpha: (0.7 - (_dragProgress * 0.5)).clamp(0.0, 1.0))
                                    : primaryTextColor.withValues(alpha: (0.7 - (_dragProgress * 0.5)).clamp(0.0, 1.0)))
                                : (isDark ? Colors.white38 : Colors.black38),
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                            letterSpacing: 1.5,
                          ),
                        ),
                ),

                // Liquid Glass Thumb Handle
                Positioned(
                  left: 4 + currentOffset,
                  child: GestureDetector(
                    onHorizontalDragUpdate: (d) => _onHorizontalDragUpdate(d, trackWidth),
                    onHorizontalDragEnd: _onHorizontalDragEnd,
                    child: LiquidParcelCard(
                      blur: 16,
                      borderRadius: 28,
                      padding: EdgeInsets.zero,
                      borderColor: widget.isLockerOnline
                          ? ParcelGlassColors.mintSignal.withValues(alpha: 0.9)
                          : (isDark ? Colors.white24 : Colors.black26),
                      borderWidth: 1.8,
                      color: widget.isLockerOnline
                          ? ParcelGlassColors.mintSignal
                          : (isDark
                              ? const Color(0xFF3D2310).withValues(alpha: 0.7)
                              : Colors.grey.withValues(alpha: 0.5)),
                      child: SizedBox(
                        width: thumbSize,
                        height: thumbSize,
                        child: Center(
                          child: Icon(
                            widget.isUnlocking
                                ? Icons.lock_open
                                : Icons.lock_outline,
                            color: widget.isLockerOnline ? Colors.black : Colors.white60,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
