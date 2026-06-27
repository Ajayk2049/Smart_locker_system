import mqtt, { MqttClient } from "mqtt";
import { config } from "../config.js";

class MQTTService {
  private client: MqttClient | null = null;
  private subscribers: Map<string, (topic: string, payload: Buffer) => void> = new Map();

  connect(): void {
    this.client = mqtt.connect(config.mqttBrokerUrl);

    this.client.on("connect", () => {
      console.log("✅ MQTT connected to broker");
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT error:", err);
    });

    this.client.on("message", (topic, payload) => {
      const callback = this.subscribers.get(topic);
      if (callback) {
        callback(topic, payload);
      }
    });
  }

  publish(deviceId: string, payload: Record<string, unknown>): void {
    if (!this.client?.connected) {
      console.error("MQTT not connected");
      return;
    }
    const topic = `box/${deviceId}/command`;
    this.client.publish(topic, JSON.stringify(payload));
    console.log(`📤 MQTT Published to ${topic}:`, payload);
  }

  subscribe(deviceId: string, callback: (topic: string, payload: Buffer) => void): void {
    if (!this.client?.connected) {
      console.error("MQTT not connected");
      return;
    }
    const topic = `box/${deviceId}/telemetry`;
    this.subscribers.set(topic, callback);
    this.client.subscribe(topic);
    console.log(`📥 MQTT Subscribed to ${topic}`);
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MQTTService();
