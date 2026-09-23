import 'package:flutter/material.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';

class ParcelGlassColors {
  // Warm Kraft Parcel Parchment Palette (matching the elegant reference design)
  static const Color kraftBackgroundTop = Color(0xFFE4D3BD);
  static const Color kraftBackgroundBottom = Color(0xFFD5BEA1);
  static const Color kraftCanvas = Color(0xFFDECBB3);
  static const Color lightCanvasTop = Color(0xFFE4D3BD);
  static const Color darkCanvasBottom = Color(0xFF1E150F);

  // Elegant Slate & Navy Typography (matching the reference design)
  static const Color navyTitle = Color(0xFF0F2B48);
  static const Color slateSubtitle = Color(0xFF5E6D7E);
  static const Color accentBlue = Color(0xFF1E6091);
  static const Color alertRed = Color(0xFFDC2626);
  static const Color alertRose = Color(0xFFDC2626);
  static const Color alertEmerald = Color(0xFF059669);

  // Hardware Indicators
  static const Color mintSignal = Color(0xFF059669);
  static const Color amberSignal = Color(0xFFD97706);
  static const Color parcelBrown = Color(0xFF3D2310);

  // Dynamic Theme Helpers
  static Color textPrimary(BuildContext context) => navyTitle;
  static Color textSecondary(BuildContext context) => slateSubtitle;
  static Color cardBg(BuildContext context) => Colors.white.withValues(alpha: 0.45);
  static Color cardBorder(BuildContext context) => Colors.white.withValues(alpha: 0.65);
}

class LiquidParcelCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final double borderWidth;
  final double blur;
  final bool isDestructive;

  const LiquidParcelCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    this.margin,
    this.borderRadius = 24.0,
    this.onTap,
    this.color,
    this.borderColor,
    this.borderWidth = 1.2,
    this.blur = 8.0,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ??
        (isDestructive
            ? const Color(0x38FEE2E2)
            : Colors.white.withValues(alpha: 0.45));

    final Widget card = Container(
      margin: margin ?? const EdgeInsets.only(bottom: 12),
      child: LiquidGlassLens(
        touch: const LiquidGlassTouch(
          flex: LiquidGlassFlex.subtle(),
        ),
        style: LiquidGlassStyle(
          shape: LiquidGlassShape.continuousRoundedRectangle(
            cornerRadius: borderRadius,
            borderWidth: borderWidth,
            borderColor: borderColor ?? Colors.white.withValues(alpha: 0.65),
          ),
          appearance: LiquidGlassAppearance(
            color: effectiveColor,
            blur: LiquidGlassBlur(sigmaX: blur, sigmaY: blur),
            shadow: const LiquidGlassShadow(
              blur: 16,
              opacity: 0.18,
              color: Color(0xFF3D2310),
              offset: Offset(0, 6),
            ),
          ),
          refraction: const LiquidGlassRefraction(
            distortion: 0.12,
            distortionWidth: 26,
            chromaticAberration: 0.002,
          ),
        ),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: card,
      );
    }
    return card;
  }
}

class ParcelGlassScaffold extends StatelessWidget {
  final Widget child;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;

  const ParcelGlassScaffold({
    super.key,
    required this.child,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: appBar,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      body: Stack(
        children: [
          // Authentic Kraft Paper Texture Background
          Positioned.fill(
            child: const ParcelKraftBackground(),
          ),

          // Foreground Content
          Positioned.fill(
            child: SafeArea(
              top: appBar == null,
              bottom: bottomNavigationBar == null,
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

class ParcelKraftBackground extends StatelessWidget {
  const ParcelKraftBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            ParcelGlassColors.kraftBackgroundTop,
            Color(0xFFDCBE9F),
            ParcelGlassColors.kraftBackgroundBottom,
          ],
        ),
      ),
      child: CustomPaint(
        painter: _KraftPaperTexturePainter(),
      ),
    );
  }
}

class _KraftPaperTexturePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF8B6B4C).withValues(alpha: 0.04)
      ..strokeWidth = 1.0;

    // Subtle paper grain fibers
    for (double y = 0; y < size.height; y += 18) {
      final double offset = (y * 13) % 40;
      canvas.drawLine(
        Offset(offset, y),
        Offset(size.width - offset, y + 2),
        paint,
      );
    }

    // Soft warm vignette at top and bottom edges
    final vignettePaint = Paint()
      ..shader = RadialGradient(
        center: Alignment.center,
        radius: 1.1,
        colors: [
          Colors.transparent,
          const Color(0xFF6B4C2F).withValues(alpha: 0.08),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), vignettePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
