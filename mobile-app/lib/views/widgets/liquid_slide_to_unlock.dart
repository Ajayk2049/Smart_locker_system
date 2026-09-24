import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_theme.dart';

class LiquidSlideToUnlock extends StatefulWidget {
  final Future<void> Function() onUnlock;
  final bool isUnlocking;
  final bool isLockerOnline;
  final bool isUnlocked;

  const LiquidSlideToUnlock({
    super.key,
    required this.onUnlock,
    this.isUnlocking = false,
    this.isLockerOnline = true,
    this.isUnlocked = false,
  });

  @override
  State<LiquidSlideToUnlock> createState() => _LiquidSlideToUnlockState();
}

class _LiquidSlideToUnlockState extends State<LiquidSlideToUnlock> {
  double _dragProgress = 0.0;
  bool _triggered = false;

  void _onHorizontalDragUpdate(DragUpdateDetails details, double trackWidth) {
    if (widget.isUnlocking || !widget.isLockerOnline || widget.isUnlocked || _triggered) return;

    const thumbSize = 52.0;
    final usableWidth = trackWidth - thumbSize - 12.0;
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
        const thumbSize = 52.0;
        const trackHeight = 64.0;
        final maxOffset = trackWidth - thumbSize - 12.0;
        final currentOffset = _dragProgress * maxOffset;

        final Color borderColor = widget.isUnlocked
            ? ParcelGlassColors.amberSignal.withValues(alpha: isDark ? 0.45 : 0.65)
            : (widget.isLockerOnline
                ? ParcelGlassColors.mintSignal.withValues(alpha: isDark ? 0.35 : 0.5)
                : (isDark ? Colors.white12 : Colors.black12));

        final Color trackBgColor = widget.isUnlocked
            ? ParcelGlassColors.amberSignal.withValues(alpha: isDark ? 0.12 : 0.16)
            : (isDark
                ? const Color(0xFF1B130E).withValues(alpha: 0.65)
                : Colors.black.withValues(alpha: 0.05));

        final Color thumbColor = widget.isUnlocked
            ? ParcelGlassColors.amberSignal
            : (widget.isLockerOnline
                ? ParcelGlassColors.mintSignal
                : (isDark ? const Color(0xFF3D2310) : Colors.grey.shade400));

        return ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: Container(
            height: trackHeight,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              color: trackBgColor,
              border: Border.all(
                color: borderColor,
                width: 1.5,
              ),
            ),
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // Active fill bar that expands as user drags
                if (!widget.isUnlocked && widget.isLockerOnline)
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: currentOffset + thumbSize + 6,
                    child: RepaintBoundary(
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
                  ),

                // Label positioned cleanly to not overlap the resting thumb
                Positioned.fill(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: thumbSize + 12),
                    child: Center(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: widget.isUnlocking
                            ? const Row(
                                mainAxisSize: MainAxisSize.min,
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
                            : widget.isUnlocked
                                ? const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.lock_open_rounded,
                                        color: ParcelGlassColors.amberSignal,
                                        size: 18,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'DOOR UNLOCKED • PUSH TO LOCK',
                                        style: TextStyle(
                                          color: ParcelGlassColors.amberSignal,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 12,
                                          letterSpacing: 0.8,
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
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                      ),
                    ),
                  ),
                ),

                // Centered Circular Thumb Handle
                Positioned(
                  left: 6 + currentOffset,
                  top: 6,
                  bottom: 6,
                  child: RepaintBoundary(
                    child: GestureDetector(
                      onHorizontalDragUpdate: (d) => _onHorizontalDragUpdate(d, trackWidth),
                      onHorizontalDragEnd: _onHorizontalDragEnd,
                      child: Container(
                        width: thumbSize,
                        height: thumbSize,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: thumbColor,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.9),
                            width: 2.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: (widget.isUnlocked
                                      ? ParcelGlassColors.amberSignal
                                      : (widget.isLockerOnline ? ParcelGlassColors.mintSignal : Colors.black))
                                  .withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            widget.isUnlocked
                                ? Icons.lock_open_rounded
                                : (widget.isUnlocking
                                    ? Icons.lock_open
                                    : Icons.lock_outline),
                            color: Colors.white,
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
