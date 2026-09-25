import mongoose, { Schema, Document } from "mongoose";

export interface ISystemConfig extends Document {
  key: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  extraSlotsCount: number;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      default: 149,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      default: 999,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    extraSlotsCount: {
      type: Number,
      default: 3,
    },
    description: {
      type: String,
      trim: true,
      default: "Unlock 3 extra co-owner slots at once (Total 5 slots capacity)",
    },
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.model<ISystemConfig>(
  "SystemConfig",
  systemConfigSchema
);
