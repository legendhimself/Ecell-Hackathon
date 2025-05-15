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

import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { config } from 'dotenv';

import { commands } from './commands';

// Load environment variables
config();

// Extract environment variables
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);

// Function to deploy commands
async function deployCommands() {
  try {
    // eslint-disable-next-line no-console
    console.log('Started refreshing slash commands...');

    // Convert commands to JSON
    const commandsData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = Array.from(commands.values()).map(command =>
      command.data.toJSON(),
    );

    // Deploy to guild
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID!), { body: commandsData });

    // eslint-disable-next-line no-console
    console.log(`Successfully reloaded ${commandsData.length} slash commands to guild ${GUILD_ID}`);
  } catch (error) {
    console.error(error);
  }
}

// Run the deployment
void deployCommands();
