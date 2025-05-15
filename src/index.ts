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

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';

import { initializeEvents } from './events/event-handler';
import { connectToDatabase } from './utils/database';
import { logger } from './utils/logger';

// Load environment variables
config();

// Check for required environment variables
const { DISCORD_TOKEN, GUILD_ID, MONGODB_URI } = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !MONGODB_URI) {
  logger.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel, // Required for DM support
    Partials.Message,
  ],
});

// Initialize event handlers
initializeEvents(client);

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    // Login to Discord
    client.login(DISCORD_TOKEN).catch(error => {
      logger.error('Error logging in to Discord:', error);
      process.exit(1);
    });
  })
  .catch(error => {
    logger.error('Failed to start the application:', error);
    process.exit(1);
  });
