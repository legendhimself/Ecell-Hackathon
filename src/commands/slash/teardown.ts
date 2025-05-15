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

import { setTimeout as sleep } from 'node:timers/promises';

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, Guild } from 'discord.js';

import { teamNames, config } from '../../config/constants';
import { RegistrationRequest } from '../../models/RegistrationRequest';
import { Team } from '../../models/Team';
import { logger } from '../../utils/logger';

// The teardown command for removing hackathon Discord server setup
export const teardownCommand = {
  data: new SlashCommandBuilder()
    .setName('teardown')
    .setDescription('Remove all hackathon Discord server teams, roles, and channels.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer the reply as this will take time
    await interaction.deferReply({ flags: 'Ephemeral' });

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    try {
      // Step 1: Remove team voice channels and category
      await removeTeamVoiceChannels(guild, true);

      // Step 2: Remove utility channels
      await removeUtilityChannels(guild, true);

      // Step 3: Remove team roles
      await removeTeamRoles(guild, true);

      // Step 4: Remove data from MongoDB
      await removeMongoData(true);

      logger.info(`Server teardown completed by user ${interaction.user.id}`, true);

      await interaction.editReply('Hackathon server teardown complete! Teams, roles, and channels have been removed.');
    } catch (error) {
      logger.error(`Error in teardown command: ${error}`, true);
      await interaction.editReply(`An error occurred during teardown: ${error}`);
    }
  },
};

// Remove team voice channels and voice category
async function removeTeamVoiceChannels(guild: Guild, silentMode: boolean = false): Promise<void> {
  logger.info('Removing team voice channels...', silentMode);

  // Delete channels in the voice category
  const category = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory && ch.name === config.categoryNames.teamVoice,
  );

  if (category) {
    // Delete all channels in this category
    const voiceChannels = guild.channels.cache.filter(
      ch => ch.parentId === category.id && ch.type === ChannelType.GuildVoice,
    );

    for (const [_, channel] of voiceChannels) {
      await sleep(400); // Adding sleep to avoid rate limiting
      try {
        await channel.delete();
        logger.info(`Deleted voice channel: ${channel.name}`, silentMode);
      } catch (error) {
        logger.error(`Error deleting voice channel ${channel.name}: ${error}`, silentMode);
      }
    }

    // Delete the category itself after all channels are deleted
    try {
      await sleep(400); // Adding sleep to avoid rate limiting
      await category.delete();
      logger.info(`Deleted voice channel category: ${category.name}`, silentMode);
    } catch (error) {
      logger.error(`Error deleting category ${category.name}: ${error}`, silentMode);
    }
  } else {
    // Check for old format voice channels as well
    const oldFormatVoiceChannels = guild.channels.cache.filter(
      ch => ch.name.startsWith(config.channelPrefixes.voice) && ch.type === ChannelType.GuildVoice,
    );

    for (const [_, channel] of oldFormatVoiceChannels) {
      await sleep(400); // Adding sleep to avoid rate limiting
      try {
        await channel.delete();
        logger.info(`Deleted old format voice channel: ${channel.name}`, silentMode);
      } catch (error) {
        logger.error(`Error deleting old format voice channel ${channel.name}: ${error}`, silentMode);
      }
    }

    // Check for any remaining team-related voice channels
    const allVoiceChannels = guild.channels.cache.filter(
      ch =>
        ch.type === ChannelType.GuildVoice &&
        (ch.name.includes('Team') ||
          ch.name.startsWith('🔊') ||
          teamNames.some(teamName => ch.name.includes(teamName))),
    );

    for (const [_, channel] of allVoiceChannels) {
      await sleep(400); // Adding sleep to avoid rate limiting
      try {
        await channel.delete();
        logger.info(`Deleted remaining team-related voice channel: ${channel.name}`, silentMode);
      } catch (error) {
        logger.error(`Error deleting team-related voice channel ${channel.name}: ${error}`, silentMode);
      }
    }

    // Check for any remaining team categories
    const teamCategories = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildCategory && (ch.name.includes('Team') || ch.name.includes('Voice')),
    );

    for (const [_, category] of teamCategories) {
      await sleep(400); // Adding sleep to avoid rate limiting
      try {
        await category.delete();
        logger.info(`Deleted remaining team category: ${category.name}`, silentMode);
      } catch (error) {
        logger.error(`Error deleting team category ${category.name}: ${error}`, silentMode);
      }
    }
  }
}

// Remove utility channels
async function removeUtilityChannels(guild: Guild, silentMode: boolean = false): Promise<void> {
  logger.info('Removing utility channels...', silentMode);

  const channelsToRemove = [
    config.channelPrefixes.registration,
    config.channelPrefixes.modLog,
    config.channelPrefixes.botAudit,
  ];

  for (const channelName of channelsToRemove) {
    const channel = guild.channels.cache.find(ch => ch.name === channelName);
    if (channel) {
      await sleep(400); // Adding sleep to avoid rate limiting
      await channel.delete();
      logger.info(`Deleted channel: ${channelName}`, silentMode);
    }
  }
}

// Remove team roles
async function removeTeamRoles(guild: Guild, silentMode: boolean = false): Promise<void> {
  logger.info('Removing team roles...', silentMode);

  // First, try to remove team roles using the known team names
  for (const teamName of teamNames) {
    const roleName = `${config.rolePrefix}${teamName}`;
    const role = guild.roles.cache.find(r => r.name === roleName);

    if (role) {
      await sleep(400); // Adding sleep to avoid rate limiting
      try {
        await role.delete();
        logger.info(`Deleted role: ${roleName}`, silentMode);
      } catch (error) {
        logger.error(`Error deleting role ${roleName}: ${error}`, silentMode);
      }
    }
  }

  // Check for any remaining team roles that might have been missed
  const remainingTeamRoles = guild.roles.cache.filter(
    r => r.name.startsWith(config.rolePrefix) || teamNames.some(teamName => r.name.includes(teamName)),
  );

  for (const [_, role] of remainingTeamRoles) {
    await sleep(400); // Adding sleep to avoid rate limiting
    try {
      await role.delete();
      logger.info(`Deleted remaining team role: ${role.name}`, silentMode);
    } catch (error) {
      logger.error(`Error deleting remaining team role ${role.name}: ${error}`, silentMode);
    }
  }

  // Remove moderator role
  const modRole = guild.roles.cache.find(r => r.name === config.moderatorRoleName);
  if (modRole) {
    await sleep(400); // Adding sleep to avoid rate limiting
    try {
      await modRole.delete();
      logger.info(`Deleted role: ${config.moderatorRoleName}`, silentMode);
    } catch (error) {
      logger.error(`Error deleting moderator role ${config.moderatorRoleName}: ${error}`, silentMode);
    }
  }

  // Check for any other roles that might be related to the hackathon
  const otherHackathonRoles = guild.roles.cache.filter(
    r =>
      r.name.toLowerCase().includes('hack') ||
      r.name.toLowerCase().includes('team') ||
      r.name.toLowerCase().includes('mod'),
  );

  for (const [_, role] of otherHackathonRoles) {
    // Skip @everyone role
    if (role.name === '@everyone') continue;

    await sleep(400); // Adding sleep to avoid rate limiting
    try {
      await role.delete();
      logger.info(`Deleted potential hackathon-related role: ${role.name}`, silentMode);
    } catch (error) {
      logger.error(`Error deleting potential hackathon-related role ${role.name}: ${error}`, silentMode);
    }
  }
}

// Remove data from MongoDB
async function removeMongoData(silentMode: boolean = false): Promise<void> {
  logger.info('Removing MongoDB data...', silentMode);

  // Delete all registration requests
  await RegistrationRequest.deleteMany({});
  await sleep(400); // Adding sleep to avoid rate limiting
  logger.info('Deleted all registration requests', silentMode);

  // Delete all team documents
  await Team.deleteMany({});
  await sleep(400); // Adding sleep to avoid rate limiting
  logger.info('Deleted all team documents', silentMode);
}
