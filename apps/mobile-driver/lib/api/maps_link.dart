import 'package:url_launcher/url_launcher.dart';

Uri googleMapsDirUri(double lat, double lng) {
  return Uri.https('www.google.com', '/maps/dir/', {
    'api': '1',
    'destination': '$lat,$lng',
    'travelmode': 'driving',
    'dir_action': 'navigate',
  });
}

Uri appleMapsDaddrUri(double lat, double lng) {
  return Uri.parse('http://maps.apple.com/?daddr=$lat,$lng');
}

Uri geoMapsUri(double lat, double lng, String label) {
  return Uri.parse(
    'geo:$lat,$lng?q=$lat,$lng(${Uri.encodeComponent(label)})',
  );
}

List<Uri> chiDuongUris(double lat, double lng, String label) {
  return [
    googleMapsDirUri(lat, lng),
    appleMapsDaddrUri(lat, lng),
    geoMapsUri(lat, lng, label),
  ];
}

Future<void> openChiDuong(double lat, double lng, String label) async {
  for (final uri in chiDuongUris(lat, lng, label)) {
    if (await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      return;
    }
  }
}
