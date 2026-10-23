import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_driver/api/maps_link.dart';

void main() {
  test('chiDuongUris is Google dir, then Apple daddr, then geo for Q1', () {
    final uris = chiDuongUris(10.776, 106.700, 'Q1');
    expect(uris, hasLength(3));
    expect(uris[0].queryParameters['api'], '1');
    expect(uris[0].queryParameters['destination'], '10.776,106.7');
    expect(uris[0].queryParameters['travelmode'], 'driving');
    expect(uris[0].queryParameters['dir_action'], 'navigate');
    expect(
      uris[1].toString(),
      'http://maps.apple.com/?daddr=10.776,106.7',
    );
    expect(
      uris[2].toString(),
      'geo:10.776,106.7?q=10.776,106.7(Q1)',
    );
    final joined = uris.map((u) => u.toString()).join(' ');
    expect(joined, isNot(contains('phone')));
    expect(joined, isNot(contains('090')));
  });
}
