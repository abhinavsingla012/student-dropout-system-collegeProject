import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: ['ASSIGNMENT', 'INTERVENTION', 'RISK_ALERT', 'SYSTEM'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      studentId: { type: Number },
      interventionId: { type: Number },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete notifications older than 30 days to keep DB clean
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model('Notification', notificationSchema);
