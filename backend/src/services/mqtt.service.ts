/**
 * @deprecated MQTT service is deprecated. The IoT architecture has been completely migrated
 * to pure REST/HTTP communication (see commandQueue.service.ts and device.controller.ts).
 */
export const mqttService = {
  connect: () => {},
  disconnect: () => {},
  publish: () => {},
  onTelemetry: () => {},
  onStatus: () => {},
};
