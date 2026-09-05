import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(8),
  RESEND_API_KEY: z.string().optional(),
  STARTMESSAGING_API_KEY: z.string().default("sm_live_99e4752f5008b0a34b7b9da01bd77a793614d27a"),
  OTP_TEMPLATE_ID: z.string().default("0afbdeb0-785d-4dd0-bd48-365a182df276"),
  DEMO_MODE: z.string().default("false"),
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
  resendApiKey: _env.RESEND_API_KEY,
  startMessagingApiKey: _env.STARTMESSAGING_API_KEY,
  otpTemplateId: _env.OTP_TEMPLATE_ID,
  demoMode: _env.DEMO_MODE.toLowerCase() === "true",
} as const;
