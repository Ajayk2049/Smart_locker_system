import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';
import '../../view_models/auth_view_model.dart';
import '../../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    context.read<HomeViewModel>().init();
  }

  void _showJoinLockerDialog(BuildContext context) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Join a Locker'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the 6-character Join Code provided by the locker owner:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: codeController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                hintText: 'e.g. SBX-79A2',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.vpn_key),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final code = codeController.text.trim();
              if (code.isEmpty) return;

              Navigator.pop(ctx);
              try {
                final res = await _api.joinDevice(code);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res['message'] ?? 'Locker joined successfully!')),
                  );
                  context.read<HomeViewModel>().fetchDevices();
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to join: ${e.toString()}')),
                  );
                }
              }
            },
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  void _showInviteDialog(BuildContext context, String deviceId, String deviceName) async {
    try {
      final res = await _api.createInviteCode(deviceId);
      final inviteCode = res['inviteCode'] ?? '';

      if (!context.mounted) return;

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('Invite to $deviceName'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Share this single-use code with your co-owner. Valid for 24 hours:',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber.shade300, width: 1.5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      inviteCode,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 20),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: inviteCode));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Join code copied to clipboard!')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating code: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeViewModel>();
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Secure Box'),
        actions: [
          IconButton(
            icon: const Icon(Icons.group_add),
            tooltip: 'Join Locker with Code',
            onPressed: () => _showJoinLockerDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => home.fetchDevices(),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
        ],
      ),
      body: home.loading
          ? const Center(child: CircularProgressIndicator())
          : home.devices.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        const Text(
                          'No Secure Boxes Connected',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Have an invite code from a family member or roommate?',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.vpn_key),
                          label: const Text('Enter Join Code'),
                          onPressed: () => _showJoinLockerDialog(context),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => home.fetchDevices(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: home.devices.length,
                    itemBuilder: (context, index) {
                      final device = home.devices[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      device.name,
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: device.online ? Colors.green[100] : Colors.grey[100],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      device.online ? 'Online' : 'Offline',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: device.online ? Colors.green[800] : Colors.grey[800],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildStatus('Door State', device.doorState == 'closed' ? 'LOCKED' : 'AJAR / OPEN'),
                                  _buildStatus('Wi-Fi', device.online ? 'CONNECTED' : 'DISCONNECTED'),
                                ],
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    _showUnlockDialog(context, device.id);
                                  },
                                  icon: const Icon(Icons.lock_open),
                                  label: const Text('Unlock Door'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Theme.of(context).colorScheme.primary,
                                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () {
                                        _showInviteDialog(context, device.id, device.name);
                                      },
                                      icon: const Icon(Icons.person_add_alt_1, size: 18),
                                      label: const Text('Invite'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () {
                                        home.fetchDeviceLogs(device.id);
                                        Navigator.pushNamed(context, '/history');
                                      },
                                      icon: const Icon(Icons.history, size: 18),
                                      label: const Text('History'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildStatus(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  void _showUnlockDialog(BuildContext context, String deviceId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unlock Secure Box'),
        content: const Text('Pulse the lock actuator to open the door for delivery?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<HomeViewModel>().unlockDevice(deviceId);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Unlock command queued for device!')),
              );
            },
            child: const Text('Unlock'),
          ),
        ],
      ),
    );
  }
}
