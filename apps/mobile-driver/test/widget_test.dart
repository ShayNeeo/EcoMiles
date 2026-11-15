import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_driver/main.dart';

void main() {
  testWidgets('PIN screen shows login button', (WidgetTester tester) async {
    await tester.pumpWidget(const EcoMilesDriverApp());
    expect(find.text('Đăng nhập'), findsOneWidget);
  });
}
