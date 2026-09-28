import { WebSocket } from "ws";
import { Device } from "../models/Device.model.js";

interface Client {
  ws: WebSocket;
  userId: string;
  role: string;
  rooms: Set<string>;
}

class WebSocketService {
  private clients: Map<string, Client> = new Map();

  addClient(clientId: string, ws: WebSocket, userId: string, role = "user"): void {
    this.clients.set(clientId, { ws, userId, role, rooms: new Set() });
    console.log(`🔌 WebSocket client connected: ${clientId} (user: ${userId}, role: ${role})`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`🔌 WebSocket client disconnected: ${clientId}`);
  }

  async joinRoom(clientId: string, deviceId: string): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client || !deviceId) return false;

    const clean = deviceId.trim().toUpperCase();

    // Admins have access to monitor all devices
    if (client.role === "admin") {
      client.rooms.add(clean);
      console.log(`📥 Admin ${clientId} joined room: ${clean}`);
      return true;
    }

    // Verify ownership in MongoDB
    try {
      const device = await Device.findOne({ deviceId: clean });
      if (!device) {
        client.ws.send(JSON.stringify({ type: "ERROR", error: `Device ${clean} not found` }));
        return false;
      }

      const isOwner = device.ownerId.toString() === client.userId;
      const isCoOwner = device.coOwners.some((cId) => cId.toString() === client.userId);

      if (!isOwner && !isCoOwner) {
        client.ws.send(JSON.stringify({ type: "ERROR", error: `Unauthorized to monitor device ${clean}` }));
        return false;
      }

      client.rooms.add(clean);
      console.log(`📥 Authorized user ${client.userId} joined room: ${clean}`);
      return true;
    } catch (err) {
      console.error(`Error verifying device ownership for room ${clean}:`, err);
      return false;
    }
  }

  broadcastToDevice(deviceId: string, message: Record<string, unknown>): void {
    const payload = JSON.stringify(message);
    const clean = deviceId.trim();
    const upper = clean.toUpperCase();
    const lower = clean.toLowerCase();

    this.clients.forEach((client) => {
      if (
        (client.rooms.has(clean) ||
          client.rooms.has(upper) ||
          client.rooms.has(lower) ||
          client.userId === clean) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(payload);
      }
    });
  }

  broadcastToAll(message: Record<string, unknown>): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
