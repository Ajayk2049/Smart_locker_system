import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(8),
  MQTT_BROKER_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let _env: Env;

try {
  _env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Invalid environment variables:", error);
  process.exit(1);
}

export const config = {
  port: parseInt(_env.PORT, 10),
  mongodbUri: _env.MONGODB_URI,
  jwtSecret: _env.JWT_SECRET,
  mqttBrokerUrl: _env.MQTT_BROKER_URL,
  resendApiKey: _env.RESEND_API_KEY,
} as const;
