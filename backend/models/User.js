import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'counselor'],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
