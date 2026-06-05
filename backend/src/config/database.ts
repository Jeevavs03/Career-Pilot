import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  try {
    mongoose.set('bufferTimeoutMS', 5000);
    await mongoose.connect(config.mongodb.uri, { serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.warn('MongoDB connection failed. Some features will be unavailable.');
    logger.warn('Install MongoDB or run: docker compose up -d');
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
