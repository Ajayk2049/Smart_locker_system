export interface DeviceCommand {
  commandId: string;
  deviceId: string;
  action: string;
  metadata?: Record<string, any>;
  enqueuedAt: Date;
  expiresAt: Date;
}

class CommandQueueService {
  // Map of deviceId -> list of active commands
  private queue: Map<string, DeviceCommand[]> = new Map();
  private readonly DEFAULT_EXPIRY_MS = 60 * 1000; // 60 seconds

  /**
   * Enqueue a new command for an IoT device (e.g., "unlock")
   */
  enqueueCommand(deviceId: string, action: string, metadata?: Record<string, any>): DeviceCommand {
    const cleanDeviceId = deviceId.trim().toUpperCase();
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.DEFAULT_EXPIRY_MS);

    const command: DeviceCommand = {
      commandId,
      deviceId: cleanDeviceId,
      action,
      metadata,
      enqueuedAt: now,
      expiresAt,
    };

    const existing = this.queue.get(cleanDeviceId) || [];
    // Remove expired commands before appending
    const active = existing.filter((c) => c.expiresAt > now);
    active.push(command);
    this.queue.set(cleanDeviceId, active);

    console.log(`📥 [CommandQueue] Enqueued command '${action}' for device '${cleanDeviceId}' (ID: ${commandId})`);
    return command;
  }

  /**
   * Consume and return the oldest non-expired pending command for a device
   */
  popPendingCommand(deviceId: string): DeviceCommand | null {
    const cleanDeviceId = deviceId.trim().toUpperCase();
    const list = this.queue.get(cleanDeviceId);
    if (!list || list.length === 0) {
      return null;
    }

    const now = new Date();
    // Filter out expired commands
    const validCommands = list.filter((c) => c.expiresAt > now);

    if (validCommands.length === 0) {
      this.queue.delete(cleanDeviceId);
      return null;
    }

    const nextCommand = validCommands.shift()!;
    this.queue.set(cleanDeviceId, validCommands);

    console.log(`📤 [CommandQueue] Dispatched command '${nextCommand.action}' to device '${cleanDeviceId}' (ID: ${nextCommand.commandId})`);
    return nextCommand;
  }

  /**
   * Peek at the next pending command without consuming it
   */
  peekPendingCommand(deviceId: string): DeviceCommand | null {
    const cleanDeviceId = deviceId.trim().toUpperCase();
    const list = this.queue.get(cleanDeviceId);
    if (!list || list.length === 0) {
      return null;
    }
    const now = new Date();
    return list.find((c) => c.expiresAt > now) || null;
  }

  /**
   * Clear all pending commands for a device
   */
  clearCommands(deviceId: string): void {
    const cleanDeviceId = deviceId.trim().toUpperCase();
    this.queue.delete(cleanDeviceId);
  }
}

export const commandQueueService = new CommandQueueService();
