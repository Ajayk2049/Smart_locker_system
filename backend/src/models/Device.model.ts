import mongoose, { Schema, Document } from "mongoose";

export interface IDevice extends Document {
  deviceId: string;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  doorState: "open" | "closed";
  battery: number;
  online: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    doorState: {
      type: String,
      enum: ["open", "closed"],
      default: "closed",
    },
    battery: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    online: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Device = mongoose.model<IDevice>("Device", deviceSchema);
