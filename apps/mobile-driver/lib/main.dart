import 'package:flutter/material.dart';

import 'screens/pin_screen.dart';
import 'theme/ecomiles_theme.dart';

void main() {
  runApp(const EcoMilesDriverApp());
}

class EcoMilesDriverApp extends StatelessWidget {
  const EcoMilesDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EcoMiles Driver',
      theme: buildEcoMilesDriverTheme(),
      home: const PinScreen(),
    );
  }
}
