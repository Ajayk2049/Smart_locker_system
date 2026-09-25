import 'package:flutter/material.dart';
import '../../../../config.dart';
import '../../widgets/glass_theme.dart';

class SettingsModals {
  static void showAboutModal(BuildContext context) {
    showParcelGlassDialog(
      context: context,
      width: 330,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: ParcelGlassColors.accentBlue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.info_outline,
                  color: ParcelGlassColors.accentBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Secure Box App',
                style: TextStyle(
                  color: ParcelGlassColors.navyTitle,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _infoRow(Icons.apps, 'App Version', '1.0.0 (Release 2026)'),
          const SizedBox(height: 10),
          _infoRow(Icons.memory, 'Locker Firmware', 'ESP32-WROOM v2.4'),
          const SizedBox(height: 10),
          _infoRow(Icons.dns, 'Server Host', AppConfig.currentHost),
          const SizedBox(height: 20),
          SizedBox(
            height: 44,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ParcelGlassColors.navyTitle,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'OK',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _infoRow(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.50), width: 1.0),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: ParcelGlassColors.slateSubtitle),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(
              color: ParcelGlassColors.slateSubtitle,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: ParcelGlassColors.navyTitle,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

}
