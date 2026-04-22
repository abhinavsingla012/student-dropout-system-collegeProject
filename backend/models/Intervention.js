import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';
import './Student.js';
import './User.js';

const { Schema } = mongoose;

const interventionSchema = new Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentId: {
      type: Number,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdById: {
      type: Number,
      default: null,
    },
    createdByName: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

interventionSchema.pre('save', async function assignNumericId() {
  if (!this.isNew || this.id) {
    return;
  }

  this.id = await getNextSequence('interventionId');
});

interventionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Intervention = mongoose.model('Intervention', interventionSchema);
