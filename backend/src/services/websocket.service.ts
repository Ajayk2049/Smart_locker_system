import { WebSocket } from "ws";

interface Client {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

class WebSocketService {
  private clients: Map<string, Client> = new Map();

  addClient(clientId: string, ws: WebSocket, userId: string): void {
    this.clients.set(clientId, { ws, userId, rooms: new Set() });
    console.log(`🔌 WebSocket client connected: ${clientId} (user: ${userId})`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`🔌 WebSocket client disconnected: ${clientId}`);
  }

  joinRoom(clientId: string, deviceId: string): void {
    const client = this.clients.get(clientId);
    if (client && deviceId) {
      const clean = deviceId.trim();
      client.rooms.add(clean);
      client.rooms.add(clean.toUpperCase());
      client.rooms.add(clean.toLowerCase());
      console.log(`📥 Client ${clientId} joined room: ${clean} (total rooms: ${client.rooms.size})`);
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
