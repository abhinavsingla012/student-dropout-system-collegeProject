import mongoose from 'mongoose';
import './User.js';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorId: {
      type: Number,
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      default: null,
      trim: true,
    },
    actorRole: {
      type: String,
      default: null,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
