import mongoose, { Schema, Document } from "mongoose";

export interface ILog extends Document {
  deviceId: mongoose.Types.ObjectId;
  action: "unlock" | "door_open" | "door_close" | "delivery_success";
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const logSchema = new Schema<ILog>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    action: {
      type: String,
      enum: ["unlock", "door_open", "door_close", "delivery_success"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

logSchema.index({ deviceId: 1, timestamp: -1 });

export const Log = mongoose.model<ILog>("Log", logSchema);
