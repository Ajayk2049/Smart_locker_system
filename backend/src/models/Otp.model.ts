import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  otp: string;
  sessionId?: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically deleted by MongoDB when expiresAt is reached
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
