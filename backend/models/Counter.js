import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

export const Counter = mongoose.model('Counter', counterSchema);

export async function getNextSequence(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return counter.value;
}
