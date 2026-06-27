import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../view_models/home_view_model.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
      ),
      body: home.logs.isEmpty
          ? const Center(
              child: Text('No activity recorded yet'),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: home.logs.length,
              itemBuilder: (context, index) {
                final log = home.logs[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: _getActionIcon(log.action),
                    title: Text(
                      _getActionLabel(log.action),
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    subtitle: Text(
                      _formatTimestamp(log.timestamp),
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _getActionIcon(String action) {
    IconData icon;
    Color color;

    switch (action) {
      case 'unlock':
        icon = Icons.lock_open;
        color = Colors.blue;
        break;
      case 'door_open':
        icon = Icons.door_sliding;
        color = Colors.orange;
        break;
      case 'door_close':
        icon = Icons.door_sliding;
        color = Colors.green;
        break;
      case 'delivery_success':
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      default:
        icon = Icons.info;
        color = Colors.grey;
    }

    return CircleAvatar(
      backgroundColor: color.withOpacity(0.1),
      child: Icon(icon, color: color, size: 20),
    );
  }

  String _getActionLabel(String action) {
    switch (action) {
      case 'unlock':
        return 'Door Unlocked';
      case 'door_open':
        return 'Door Opened';
      case 'door_close':
        return 'Door Closed';
      case 'delivery_success':
        return 'Delivery Completed';
      default:
        return action;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
  }
}
