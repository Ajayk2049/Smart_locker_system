import { WebSocket } from "ws";

interface Client {
  ws: WebSocket;
  userId: string;
  deviceId?: string;
}

class WebSocketService {
  private clients: Map<string, Client> = new Map();

  addClient(clientId: string, ws: WebSocket, userId: string): void {
    this.clients.set(clientId, { ws, userId });
    console.log(`🔌 WebSocket client connected: ${clientId}`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`🔌 WebSocket client disconnected: ${clientId}`);
  }

  joinRoom(clientId: string, deviceId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.deviceId = deviceId;
      console.log(`📥 Client ${clientId} joined room: ${deviceId}`);
    }
  }

  broadcastToDevice(deviceId: string, message: Record<string, unknown>): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.deviceId === deviceId && client.ws.readyState === WebSocket.OPEN) {
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
