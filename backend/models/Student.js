import mongoose from 'mongoose';
import './User.js';

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
    },
    attendance: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    area: {
      type: String,
      required: true,
      enum: ['rural', 'semi-urban', 'urban'],
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female'],
    },
    economicStatus: {
      type: String,
      required: true,
      enum: ['low', 'mid', 'high'],
    },
    parentEducation: {
      type: String,
      required: true,
      enum: ['none', 'primary', 'secondary', 'graduate'],
    },
    distanceFromSchool: {
      type: Number,
      required: true,
      min: 0,
    },
    previousFailures: {
      type: Number,
      required: true,
      min: 0,
    },
    hasScholarship: {
      type: Boolean,
      default: false,
    },
    interventions: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Intervention' }],
      default: [],
    },
    assignedCounselor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedCounselorId: {
      type: Number,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

studentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Student = mongoose.model('Student', studentSchema);
