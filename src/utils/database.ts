/**
 * @description Handles team registration commands and user enrollment processes
 * @author A. Rahman Syed
 * @github legendhimself
 * @version 1.0.0
 *
 * This file is part of the E-Cell Hackathon Discord bot.
 * For questions or issues, please contact the maintainers at:
 * https://github.com/E-Cell-MJCET
 */

import process from 'node:process';
import { setTimeout } from 'node:timers';
import { setTimeout as sleep } from 'node:timers/promises';

import mongoose from 'mongoose';

import { logger } from './logger';

// Maximum number of reconnection attempts
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_INTERVAL = 5_000; // 5 seconds

// Connect to MongoDB with retry logic
export const connectToDatabase = async (retryAttempt = 0): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) throw new Error('MONGODB_URI is not defined in environment variables');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5_000,
      retryWrites: true,
    });

    // Set up event listeners for connection issues
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      if (retryAttempt < MAX_RETRY_ATTEMPTS) setTimeout(() => void connectToDatabase(retryAttempt + 1), RETRY_INTERVAL);
      else {
        logger.error('Failed to reconnect to MongoDB after maximum attempts');
        process.exit(1);
      }
    });

    mongoose.connection.on('error', (err: mongoose.Error) => {
      logger.error('MongoDB connection error:', err.message as any);
    });

    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error connecting to MongoDB:', errorMessage as any);

    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      logger.info(`Retrying connection (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
      await sleep(RETRY_INTERVAL);
      return connectToDatabase(retryAttempt + 1);
    } else {
      logger.error('Failed to connect to MongoDB after maximum attempts');
      process.exit(1);
    }
  }
};

// Close database connection gracefully
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error disconnecting from MongoDB:', errorMessage as any);
    throw error; // Re-throw to handle at a higher level
  }
};
