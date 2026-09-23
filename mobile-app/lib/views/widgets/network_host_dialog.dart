import 'package:flutter/material.dart';
import '../../config.dart';
import '../../services/api_service.dart';
import 'glass_theme.dart';

class NetworkHostDialog extends StatefulWidget {
  const NetworkHostDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.7),
      builder: (_) => const NetworkHostDialog(),
    );
  }

  @override
  State<NetworkHostDialog> createState() => _NetworkHostDialogState();
}

class _NetworkHostDialogState extends State<NetworkHostDialog> {
  late TextEditingController _hostController;
  bool _testing = false;
  bool? _isHealthy;
  String _statusMessage = '';

  @override
  void initState() {
    super.initState();
    _hostController = TextEditingController(text: AppConfig.currentHost);
    _testConnection();
  }

  @override
  void dispose() {
    _hostController.dispose();
    super.dispose();
  }

  Future<void> _testConnection([String? hostToTest]) async {
    final host = (hostToTest ?? _hostController.text).trim();
    if (host.isEmpty) return;

    setState(() {
      _testing = true;
      _isHealthy = null;
      _statusMessage = 'Pinging http://$host/api/health...';
    });

    final ok = await ApiService().checkHealth(host);

    if (mounted) {
      setState(() {
        _testing = false;
        _isHealthy = ok;
        _statusMessage = ok
            ? 'Connected! Local backend is healthy and responding.'
            : 'Could not connect. Ensure backend is running and phone is on the same Wi-Fi.';
      });
    }
  }

  Future<void> _saveAndApply() async {
    final newHost = _hostController.text.trim();
    if (newHost.isNotEmpty) {
      await AppConfig.updateHost(newHost);
    }
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Server set to: http://${AppConfig.currentHost}'),
          backgroundColor: ParcelGlassColors.parcelBrown,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: LiquidParcelCard(
        blur: 24,
        borderRadius: 20,
        borderColor: Colors.white.withValues(alpha: 0.18),
        color: const Color(0xFF1E150F).withValues(alpha: 0.9),
        padding: const EdgeInsets.all(22),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: ParcelGlassColors.mintSignal.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: ParcelGlassColors.mintSignal.withValues(alpha: 0.4),
                      ),
                    ),
                    child: const Icon(
                      Icons.wifi,
                      color: ParcelGlassColors.mintSignal,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Wi-Fi Server Connect',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Local development network settings',
                          style: TextStyle(
                            color: Colors.white60,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white60, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Host Input Field
              const Text(
                'BACKEND HOST & PORT',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _hostController,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                decoration: InputDecoration(
                  hintText: 'e.g. 192.168.0.101:4300',
                  hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.4),
                  prefixIcon: const Icon(Icons.dns, color: Colors.white54, size: 18),
                  suffixIcon: IconButton(
                    icon: _testing
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: ParcelGlassColors.mintSignal,
                            ),
                          )
                        : const Icon(Icons.refresh, color: ParcelGlassColors.mintSignal),
                    onPressed: _testing ? null : () => _testConnection(),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: ParcelGlassColors.mintSignal),
                  ),
                ),
              ),

              const SizedBox(height: 12),
              // Quick Presets
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _presetChip('192.168.0.101:4300', 'Laptop Wi-Fi'),
                  _presetChip('10.0.2.2:4300', 'Android Emulator'),
                  _presetChip('localhost:4300', 'Localhost'),
                ],
              ),

              const SizedBox(height: 16),

              // Status Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: _isHealthy == true
                      ? ParcelGlassColors.alertEmerald.withValues(alpha: 0.15)
                      : _isHealthy == false
                          ? ParcelGlassColors.alertRose.withValues(alpha: 0.15)
                          : ParcelGlassColors.amberSignal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _isHealthy == true
                        ? ParcelGlassColors.alertEmerald.withValues(alpha: 0.4)
                        : _isHealthy == false
                            ? ParcelGlassColors.alertRose.withValues(alpha: 0.4)
                            : ParcelGlassColors.amberSignal.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isHealthy == true
                          ? Icons.check_circle
                          : _isHealthy == false
                              ? Icons.error
                              : Icons.sync,
                      size: 18,
                      color: _isHealthy == true
                          ? ParcelGlassColors.alertEmerald
                          : _isHealthy == false
                              ? ParcelGlassColors.alertRose
                              : ParcelGlassColors.amberSignal,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _statusMessage,
                        style: TextStyle(
                          color: _isHealthy == true
                              ? ParcelGlassColors.alertEmerald
                              : _isHealthy == false
                                  ? ParcelGlassColors.alertRose
                                  : Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white70,
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ParcelGlassColors.mintSignal,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      onPressed: _saveAndApply,
                      child: const Text(
                        'Apply Server',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _presetChip(String host, String label) {
    final isSelected = _hostController.text.trim() == host;
    return GestureDetector(
      onTap: () {
        _hostController.text = host;
        _testConnection(host);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? ParcelGlassColors.mintSignal.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected
                ? ParcelGlassColors.mintSignal
                : Colors.white.withValues(alpha: 0.12),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? ParcelGlassColors.mintSignal : Colors.white70,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
