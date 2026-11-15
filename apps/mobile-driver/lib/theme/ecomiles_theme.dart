import 'package:flutter/material.dart';

/// EcoMiles Asphalt & Paper brand tokens for the driver app.
/// Mirrors brand/tokens.json (do not use off-palette colors).
class EcoMilesColors {
  EcoMilesColors._();

  static const Color paper = Color(0xFFF6F1E7);
  static const Color paperCard = Color(0xFFFBF8F1);
  static const Color paperPure = Color(0xFFFFFFFF);
  static const Color paperSunken = Color(0xFFECE5D7);

  static const Color ink = Color(0xFF101418);
  static const Color inkBody = Color(0xFF2A2F36);
  static const Color inkMuted = Color(0xFF5B5F66);
  static const Color inkInverse = Color(0xFFF6F1E7);
  static const Color inkInverseMuted = Color(0xFFC9C3B6);

  static const Color line = Color(0xFFD8D2C4);
  static const Color lineStrong = Color(0xFFBDB5A3);

  static const Color routeCobalt = Color(0xFF1B45D7);
  static const Color routeCobaltTint = Color(0xFFEEF2FC);
  static const Color verifiedGreen = Color(0xFF0B7A3B);
  static const Color verifiedGreenTint = Color(0xFFEAF5EE);
  static const Color windowAmber = Color(0xFFA64B08);
  static const Color windowAmberTint = Color(0xFFFDF3E7);
  static const Color violationRed = Color(0xFFB42318);
  static const Color violationRedTint = Color(0xFFFCECEB);
}

class EcoMilesMetrics {
  EcoMilesMetrics._();

  static const double driverRadius = 8.0;
  static const double touchTargetHeight = 48.0;
}

/// Pure-vector Return M mark for daylight and cab-glare legibility.
class EcoMilesReturnMark extends StatelessWidget {
  const EcoMilesReturnMark({super.key, this.size = 24});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _ReturnMarkPainter()),
    );
  }
}

class _ReturnMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 32.0;
    final bgRect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(6 * s),
    );
    canvas.drawRRect(bgRect, Paint()..color = EcoMilesColors.ink);

    final mPaint = Paint()
      ..color = EcoMilesColors.paperCard
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.6 * s
      ..strokeCap = StrokeCap.square
      ..strokeJoin = StrokeJoin.miter;

    final mPath = Path()
      ..moveTo(8 * s, 23 * s)
      ..lineTo(8 * s, 9.5 * s)
      ..lineTo(16 * s, 18.5 * s)
      ..lineTo(24 * s, 9.5 * s)
      ..lineTo(24 * s, 23 * s);
    canvas.drawPath(mPath, mPaint);

    final returnPaint = Paint()
      ..color = EcoMilesColors.routeCobalt
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2 * s
      ..strokeCap = StrokeCap.square;
    canvas.drawLine(Offset(24 * s, 23 * s), Offset(8 * s, 23 * s), returnPaint);

    canvas.drawCircle(
      Offset(8 * s, 23 * s),
      2.2 * s,
      Paint()..color = EcoMilesColors.verifiedGreen,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

ThemeData buildEcoMilesDriverTheme() {
  const scheme = ColorScheme(
    brightness: Brightness.light,
    primary: EcoMilesColors.routeCobalt,
    onPrimary: EcoMilesColors.paperCard,
    secondary: EcoMilesColors.ink,
    onSecondary: EcoMilesColors.paper,
    error: EcoMilesColors.violationRed,
    onError: EcoMilesColors.paperPure,
    surface: EcoMilesColors.paperCard,
    onSurface: EcoMilesColors.ink,
    outline: EcoMilesColors.line,
  );

  final shape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(EcoMilesMetrics.driverRadius),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: EcoMilesColors.paper,
    appBarTheme: const AppBarTheme(
      backgroundColor: EcoMilesColors.ink,
      foregroundColor: EcoMilesColors.paper,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: EcoMilesColors.paper,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
    ),
    cardTheme: CardThemeData(
      color: EcoMilesColors.paperCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(EcoMilesMetrics.driverRadius),
        side: const BorderSide(color: EcoMilesColors.line),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: EcoMilesColors.line,
      thickness: 1,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: EcoMilesColors.routeCobalt,
        foregroundColor: EcoMilesColors.paperCard,
        minimumSize: const Size(0, EcoMilesMetrics.touchTargetHeight),
        shape: shape,
        elevation: 0,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: EcoMilesColors.ink,
        foregroundColor: EcoMilesColors.paper,
        minimumSize: const Size(0, EcoMilesMetrics.touchTargetHeight),
        shape: shape,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: EcoMilesColors.ink,
        backgroundColor: EcoMilesColors.paperCard,
        minimumSize: const Size(0, EcoMilesMetrics.touchTargetHeight),
        side: const BorderSide(color: EcoMilesColors.lineStrong),
        shape: shape,
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: EcoMilesColors.paperCard,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(EcoMilesMetrics.driverRadius),
        borderSide: const BorderSide(color: EcoMilesColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(EcoMilesMetrics.driverRadius),
        borderSide: const BorderSide(color: EcoMilesColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(EcoMilesMetrics.driverRadius),
        borderSide: const BorderSide(
          color: EcoMilesColors.routeCobalt,
          width: 1.5,
        ),
      ),
    ),
  );
}
