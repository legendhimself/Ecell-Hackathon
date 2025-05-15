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

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Client } from 'discord.js';
import mongoose from 'mongoose';

import { logger } from '../../utils/logger';

// The health command for checking system status
export const healthCommand = {
  data: new SlashCommandBuilder().setName('health').setDescription('Check the health status of the bot and database'),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    try {
      await interaction.deferReply();

      const discordPing = client.ws.ping;
      const discordStatus = discordPing < 200 ? '🟢 Good' : discordPing < 500 ? '🟡 Degraded' : '🔴 Poor';

      let dbStatus = '🔴 Disconnected';
      let dbLatency = 'N/A';

      try {
        if (mongoose.connection.readyState === 1) {
          const dbStart = Date.now();
          if (!mongoose.connection.db) throw new Error('MongoDB connection is not established.');

          await mongoose.connection.db.admin().ping();
          const dbEnd = Date.now();
          dbLatency = `${dbEnd - dbStart}ms`;
          dbStatus = '🟢 Connected';
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`MongoDB connection error: ${errorMessage}`);
        dbStatus = '🔴 Error';
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Bot Health Status')
        .addFields(
          { name: 'Discord API', value: `${discordStatus} (${discordPing}ms)`, inline: true },
          { name: 'MongoDB', value: `${dbStatus} (${dbLatency})`, inline: true },
          { name: 'Bot Uptime', value: formatUptime(client.uptime), inline: true },
          { name: 'System Memory', value: formatMemoryUsage(), inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logger.info(`Health check performed by user ${interaction.user.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in health command: ${errorMessage}`);

      const response = { content: 'An error occurred while checking system health.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.editReply(response);
      else await interaction.reply(response);
    }
  },
};

// Format uptime in a human-readable format
function formatUptime(uptime: number | null): string {
  if (!uptime) return 'Unknown';

  const totalSeconds = Math.floor(uptime / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);

  if (hours > 0) parts.push(`${hours}h`);

  if (minutes > 0) parts.push(`${minutes}m`);

  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

// Format memory usage in a human-readable format
function formatMemoryUsage(): string {
  const memoryUsage = process.memoryUsage();
  const usedMB = Math.round((memoryUsage.heapUsed / 1_024 / 1_024) * 100) / 100;
  const totalMB = Math.round((memoryUsage.heapTotal / 1_024 / 1_024) * 100) / 100;

  return `${usedMB}MB / ${totalMB}MB`;
}
