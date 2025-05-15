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

import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { logger } from '../../utils/logger';

// The ping command for health check
export const pingCommand = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check if the bot is online and responsive'),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    try {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

      // Calculate round-trip latency
      const roundTripLatency = sent.createdTimestamp - interaction.createdTimestamp;

      // Get WebSocket latency
      const wsLatency = client.ws.ping;

      await interaction.editReply(
        `🏓 Pong!\n` + `Roundtrip latency: ${roundTripLatency}ms\n` + `WebSocket latency: ${wsLatency}ms`,
      );

      logger.debug(`Ping command executed by ${interaction.user.id}`);
    } catch (error) {
      logger.error(`Error in ping command: ${error}`);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('An error occurred while checking bot health.');
      } else {
        await interaction.reply({ content: 'An error occurred while checking bot health.', flags: 'Ephemeral' });
      }
    }
  },
};
