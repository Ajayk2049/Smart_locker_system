import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../models/device.model.dart';
import '../../../services/api_service.dart';
import '../../../view_models/home_view_model.dart';
import '../../widgets/glass_theme.dart';
import '../../home/widgets/co_owner_invite_sheet.dart';
import 'unlock_slots_modal.dart';

class ManageUsersDialog extends StatefulWidget {
  const ManageUsersDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showParcelGlassDialog(
      context: context,
      width: 360,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: const ManageUsersDialog(),
    );
  }

  @override
  State<ManageUsersDialog> createState() => _ManageUsersDialogState();
}

class _ManageUsersDialogState extends State<ManageUsersDialog> {
  DeviceModel? _selectedDevice;
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _slotsData;

  @override
  void initState() {
    super.initState();
    final home = context.read<HomeViewModel>();
    final devices = home.devices;
    _selectedDevice = home.selectedDevice ?? (devices.isNotEmpty ? devices.first : null);
    if (_selectedDevice != null) {
      _fetchSlots();
    } else {
      _isLoading = false;
    }
  }

  Future<void> _fetchSlots() async {
    if (_selectedDevice == null) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService().getDeviceSlots(_selectedDevice!.id);
      if (mounted) {
        setState(() {
          _slotsData = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '').trim();
        });
      }
    }
  }

  Future<void> _handleRenameCoOwner(String userId, String currentName) async {
    final controller = TextEditingController(text: currentName);
    final newName = await showParcelGlassDialog<String>(
      context: context,
      width: 320,
      padding: const EdgeInsets.all(18),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.edit, size: 18, color: ParcelGlassColors.accentBlue),
              SizedBox(width: 8),
              Text(
                'RENAME CO-OWNER',
                style: TextStyle(
                  color: ParcelGlassColors.navyTitle,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(
              color: ParcelGlassColors.navyTitle,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              labelText: 'Nickname or Alias',
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.25),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.50)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ParcelGlassColors.navyTitle,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('SAVE ALIAS', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty && mounted) {
      try {
        await ApiService().renameCoOwner(_selectedDevice!.id, userId, newName);
        _fetchSlots();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: ${e.toString()}'), backgroundColor: ParcelGlassColors.alertRose),
          );
        }
      }
    }
  }

  Future<void> _handleRevoke(String userId, String userName) async {
    final confirmed = await showParcelGlassDialog<bool>(
      context: context,
      width: 320,
      padding: const EdgeInsets.all(18),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, size: 20, color: ParcelGlassColors.alertRose),
              SizedBox(width: 8),
              Text(
                'REVOKE ACCESS',
                style: TextStyle(
                  color: ParcelGlassColors.alertRose,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Are you sure you want to revoke locker access for "$userName"? They will no longer be able to open this box.',
            style: const TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 12.5),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ParcelGlassColors.alertRose,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Revoke', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await ApiService().removeCoOwner(_selectedDevice!.id, userId);
        _fetchSlots();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Access revoked for $userName'), backgroundColor: ParcelGlassColors.accentBlue),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: ${e.toString()}'), backgroundColor: ParcelGlassColors.alertRose),
          );
        }
      }
    }
  }

  void _openUnlockSlotsModal() {
    if (_selectedDevice == null) return;
    final allowed = _slotsData?['allowedSlots'] ?? 2;
    UnlockSlotsModal.show(
      context: context,
      deviceId: _selectedDevice!.id,
      deviceName: _selectedDevice!.name,
      currentAllowed: allowed,
      onRequestSent: _fetchSlots,
    );
  }

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeViewModel>();
    final devices = home.devices;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                    Icons.people_outline,
                    color: ParcelGlassColors.accentBlue,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'MANAGE USERS',
                  style: TextStyle(
                    color: ParcelGlassColors.navyTitle,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.close, color: ParcelGlassColors.slateSubtitle, size: 20),
              onPressed: () => Navigator.pop(context),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        const SizedBox(height: 14),

        if (devices.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: Text(
                'No smart lockers linked to this account.',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 13),
              ),
            ),
          )
        else ...[
          // Device Selector if multiple devices
          if (devices.length > 1) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.50)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<DeviceModel>(
                  value: _selectedDevice != null && devices.any((d) => d.id == _selectedDevice!.id)
                      ? devices.firstWhere((d) => d.id == _selectedDevice!.id)
                      : devices.first,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down, color: ParcelGlassColors.accentBlue),
                  onChanged: (DeviceModel? newDevice) {
                    if (newDevice != null) {
                      setState(() => _selectedDevice = newDevice);
                      _fetchSlots();
                    }
                  },
                  items: devices.map((d) {
                    return DropdownMenuItem<DeviceModel>(
                      value: d,
                      child: Text(
                        '${d.name} (${d.deviceId})',
                        style: const TextStyle(
                          color: ParcelGlassColors.navyTitle,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 30),
              child: Center(
                child: CircularProgressIndicator(strokeWidth: 2, color: ParcelGlassColors.accentBlue),
              ),
            )
          else if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: ParcelGlassColors.alertRose, fontSize: 12),
              ),
            )
          else if (_slotsData != null) ...[
            _buildSlotsSummary(),
            const SizedBox(height: 12),
            _buildSlotList(),
            if ((_slotsData?['allowedSlots'] ?? 2) < 5) ...[
              const SizedBox(height: 12),
              _buildUnlockSlotsButton(),
            ],
          ],
        ],
      ],
    );
  }

  Widget _buildSlotsSummary() {
    final allowed = _slotsData?['allowedSlots'] ?? 2;
    final used = _slotsData?['usedSlots'] ?? 1;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.50)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Row(
            children: [
              Icon(Icons.shield_outlined, size: 16, color: ParcelGlassColors.accentBlue),
              SizedBox(width: 8),
              Text(
                'Locker Capacity:',
                style: TextStyle(color: ParcelGlassColors.slateSubtitle, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          Text(
            '$used / $allowed Active (5 Total)',
            style: const TextStyle(
              color: ParcelGlassColors.navyTitle,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlotList() {
    final primaryOwner = _slotsData?['primaryOwner'];
    final List coOwners = _slotsData?['coOwners'] ?? [];
    final Map nicknames = _slotsData?['coOwnerNicknames'] ?? {};
    final int allowedSlots = _slotsData?['allowedSlots'] ?? 2;
    final bool isOwner = _slotsData?['isOwner'] ?? false;

    final List<Widget> slotCards = [];

    // Slot 1: Primary Owner
    final ownerName = primaryOwner is Map ? (primaryOwner['name'] ?? 'Primary Owner') : 'Primary Owner';
    final ownerPhone = primaryOwner is Map
        ? ((primaryOwner['phone'] != null && primaryOwner['phone'].toString().isNotEmpty)
            ? primaryOwner['phone'].toString()
            : (primaryOwner['email'] ?? ''))
        : '';

    slotCards.add(_buildUserSlotRow(
      slotNumber: 1,
      name: ownerName,
      phoneOrContact: ownerPhone,
      badgeText: 'PRIMARY OWNER',
      badgeColor: ParcelGlassColors.accentBlue,
      isLocked: false,
    ));

    // Slots 2 to 5
    for (int i = 2; i <= 5; i++) {
      final isSlotUnlocked = i <= allowedSlots;
      final coOwnerIndex = i - 2;

      if (!isSlotUnlocked) {
        // Locked Slot
        slotCards.add(_buildLockedSlotRow(slotNumber: i));
      } else if (coOwnerIndex < coOwners.length) {
        // Occupied Co-Owner Slot
        final coOwner = coOwners[coOwnerIndex];
        final coOwnerId = coOwner is Map ? (coOwner['_id'] ?? coOwner['id'] ?? '') : coOwner.toString();
        final rawPhone = coOwner is Map ? (coOwner['phone'] ?? '') : '';
        final email = coOwner is Map ? (coOwner['email'] ?? '') : '';
        final phoneOrContact = (rawPhone.toString().isNotEmpty) ? rawPhone.toString() : email;
        final defaultName = coOwner is Map ? (coOwner['name'] ?? phoneOrContact) : phoneOrContact;
        final alias = (nicknames[coOwnerId] != null && nicknames[coOwnerId].toString().isNotEmpty)
            ? nicknames[coOwnerId]
            : defaultName;

        slotCards.add(_buildUserSlotRow(
          slotNumber: i,
          name: alias,
          phoneOrContact: phoneOrContact,
          badgeText: 'CO-OWNER',
          badgeColor: ParcelGlassColors.mintSignal,
          isLocked: false,
          isCoOwner: true,
          isOwnerView: isOwner,
          onEditName: () => _handleRenameCoOwner(coOwnerId, alias),
          onRevoke: () => _handleRevoke(coOwnerId, alias),
        ));
      } else {
        // Unoccupied Unlocked Slot
        slotCards.add(_buildAvailableSlotRow(slotNumber: i));
      }
    }

    return Column(
      children: slotCards,
    );
  }

  Widget _buildUserSlotRow({
    required int slotNumber,
    required String name,
    required String phoneOrContact,
    required String badgeText,
    required Color badgeColor,
    required bool isLocked,
    bool isCoOwner = false,
    bool isOwnerView = false,
    VoidCallback? onEditName,
    VoidCallback? onRevoke,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.50),
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Slot Number Badge
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: badgeColor.withValues(alpha: 0.15),
            ),
            child: Center(
              child: Text(
                '$slotNumber',
                style: TextStyle(
                  color: badgeColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // User Info (Name + Action buttons + Phone)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top line: Name + inline edit button
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: ParcelGlassColors.navyTitle,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (isCoOwner && isOwnerView && onEditName != null) ...[
                      const SizedBox(width: 4),
                      InkWell(
                        onTap: onEditName,
                        borderRadius: BorderRadius.circular(6),
                        child: const Padding(
                          padding: EdgeInsets.all(2.0),
                          child: Icon(
                            Icons.edit_outlined,
                            size: 14,
                            color: ParcelGlassColors.accentBlue,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                // Bottom line: Phone number / contact
                Row(
                  children: [
                    const Icon(
                      Icons.phone_android_outlined,
                      size: 11,
                      color: ParcelGlassColors.slateSubtitle,
                    ),
                    const SizedBox(width: 3),
                    Flexible(
                      child: Text(
                        phoneOrContact,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: ParcelGlassColors.slateSubtitle,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),

          // Right End: Role Badge & Revoke Button neatly aligned
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    color: badgeColor,
                    fontSize: 8.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              if (isCoOwner && isOwnerView && onRevoke != null) ...[
                const SizedBox(width: 6),
                InkWell(
                  onTap: onRevoke,
                  borderRadius: BorderRadius.circular(6),
                  child: const Padding(
                    padding: EdgeInsets.all(3.0),
                    child: Icon(
                      Icons.person_remove_outlined,
                      size: 15,
                      color: ParcelGlassColors.alertRose,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLockedSlotRow({required int slotNumber}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.25),
          width: 1.0,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.black12,
            ),
            child: const Center(
              child: Icon(Icons.lock_outline, size: 13, color: ParcelGlassColors.slateSubtitle),
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Locked Slot',
                  style: TextStyle(
                    color: ParcelGlassColors.slateSubtitle,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Reserved capacity (Unlock via admin)',
                  style: TextStyle(
                    color: ParcelGlassColors.slateSubtitle,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.black12,
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text(
              'LOCKED',
              style: TextStyle(
                color: ParcelGlassColors.slateSubtitle,
                fontSize: 8.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvailableSlotRow({required int slotNumber}) {
    final isOwner = _slotsData?['isOwner'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.40),
          width: 1.0,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: ParcelGlassColors.amberSignal.withValues(alpha: 0.15),
            ),
            child: Center(
              child: Text(
                '$slotNumber',
                style: const TextStyle(
                  color: ParcelGlassColors.amberSignal,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Empty Slot',
                  style: TextStyle(
                    color: ParcelGlassColors.navyTitle,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Available for family or co-owner',
                  style: TextStyle(
                    color: ParcelGlassColors.slateSubtitle,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              if (_selectedDevice != null && isOwner) {
                CoOwnerInviteSheet.show(
                  context,
                  _selectedDevice!.deviceId,
                  _selectedDevice!.name,
                );
              }
            },
            borderRadius: BorderRadius.circular(4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: ParcelGlassColors.amberSignal.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: ParcelGlassColors.amberSignal.withValues(alpha: 0.5),
                  width: 0.8,
                ),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'AVAILABLE',
                    style: TextStyle(
                      color: ParcelGlassColors.amberSignal,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.3,
                    ),
                  ),
                  SizedBox(width: 3),
                  Icon(
                    Icons.person_add_alt_1,
                    size: 10,
                    color: ParcelGlassColors.amberSignal,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUnlockSlotsButton() {
    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        foregroundColor: ParcelGlassColors.navyTitle,
        side: BorderSide(color: ParcelGlassColors.navyTitle.withValues(alpha: 0.35)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
        backgroundColor: Colors.white.withValues(alpha: 0.15),
      ),
      onPressed: _openUnlockSlotsModal,
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.workspace_premium_outlined, size: 16, color: ParcelGlassColors.amberSignal),
          SizedBox(width: 8),
          Text(
            'UNLOCK MORE SLOTS (SEE PLANS)',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}
