import 'package:flutter/material.dart';

import '../api/client.dart';
import '../models/driver_route.dart';
import '../theme/ecomiles_theme.dart';
import 'route_list.dart';

class PinScreen extends StatefulWidget {
  const PinScreen({super.key, this.createClient});

  final ApiClient Function(String pin)? createClient;

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  final TextEditingController _pin = TextEditingController();
  String? _message;
  bool _loading = false;

  @override
  void dispose() {
    _pin.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    final client = widget.createClient?.call(_pin.text) ?? ApiClient(pin: _pin.text);
    try {
      await client.getHealth();
      final DriverRouteList routes = await client.getDriverRoute();
      if (!mounted) {
        return;
      }
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => RouteListScreen(routes: routes, client: client),
        ),
      );
    } on ApiException catch (err) {
      if (!mounted) {
        return;
      }
      setState(() {
        _message = err.statusCode == 401
            ? 'PIN không đúng'
            : '${err.statusCode}';
      });
    } catch (err) {
      if (!mounted) {
        return;
      }
      setState(() {
        _message = err.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            EcoMilesReturnMark(size: 24),
            SizedBox(width: 10),
            Text('EcoMiles tài xế'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _pin,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'PIN'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: const Text('Đăng nhập'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 16),
              Text(_message!),
            ],
          ],
        ),
      ),
    );
  }
}
