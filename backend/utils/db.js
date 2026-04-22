import mongoose from 'mongoose';
import { appConfig } from '../config/appConfig.js';

export async function connectDB() {
  const mongoUri = appConfig.mongoUri;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
