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

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  Guild,
  TextChannel,
  Client,
} from 'discord.js';

import { teamNames, config } from '../../config/constants';
import { Team } from '../../models/Team';
import { logger } from '../../utils/logger';
import { createRegistrationEmbed } from '../../utils/registration-embed';
// The setup command for initializing the hackathon Discord server
export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the hackathon Discord server with teams, roles, and channels.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    // Defer the reply as this will take time
    await interaction.deferReply({ flags: 'Ephemeral' });

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    try {
      // Step 1: Create channels (registration, mod-log)
      await createUtilityChannels(guild);

      // reinitialize logger with the client
      logger.initialize(client);
      await sleep(1_000);

      // Step 2: Create MongoDB team models
      await createTeamModels();

      // Step 3: Create Discord roles
      await createTeamRoles(guild);

      // Step 4: Create team voice channels
      await createTeamVoiceChannels(guild);

      logger.info(`Server setup completed by user ${interaction.user.id}`, true);

      await interaction.editReply('Hackathon server setup complete! Teams, roles, and channels have been created.');
    } catch (error) {
      logger.error(`Error in setup command: ${error}`);
      console.error(error);
      await interaction.editReply(`An error occurred during setup: ${error}`);
    }
  },
};

// Create team models in MongoDB
async function createTeamModels(): Promise<void> {
  logger.info('Creating team models in MongoDB...', true);

  // Create a team document for each team name
  for (const teamName of teamNames) {
    // Check if team already exists
    const existingTeam = await Team.findOne({ teamName });

    if (existingTeam) logger.info(`Team model for ${teamName} already exists`, true);
    else {
      // Create new team
      await Team.create({ teamName, members: [] });
      logger.info(`Created team model for ${teamName}`, true);
    }
  }
}

// Create team roles in Discord
async function createTeamRoles(guild: Guild): Promise<void> {
  logger.info('Creating team roles...', true);

  for (const teamName of teamNames) {
    const roleName = `${config.rolePrefix}${teamName}`;

    // Check if role already exists
    let role = guild.roles.cache.find(r => r.name === roleName);

    if (role) logger.info(`Role for ${teamName} already exists`, true);
    else {
      await sleep(400);
      // Create role with random color
      role = await guild.roles
        .create({
          name: roleName,
          color: generateRandomColor(),
          reason: 'Hackathon team role',
        })
        .catch(error => {
          logger.error(`Error creating role for ${teamName}: ${error}`);
          throw new Error(`Failed to create role for ${teamName}`);
        });

      logger.info(`Created role for ${teamName}`, true);
    }
  }
}

// Create utility channels (registration, mod-log, bot-audit)
async function createUtilityChannels(guild: Guild): Promise<void> {
  logger.info('Creating utility channels...', true);

  // Find or create Moderators role
  let modRole = guild.roles.cache.find(r => r.name === config.moderatorRoleName);

  if (!modRole) {
    await sleep(400);
    modRole = await guild.roles.create({
      name: config.moderatorRoleName,
      color: 'Red',
      reason: 'Hackathon moderator role',
      permissions: [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ModerateMembers,
      ],
      position: 1, // Position it high up in the role list
    });

    logger.info('Created Moderators role', true);
  }

  // Bot-audit channel
  const botAuditChannelName = config.channelPrefixes.botAudit;
  let botAuditChannel = guild.channels.cache.find(ch => ch.name === botAuditChannelName) as TextChannel | undefined;

  if (!botAuditChannel) {
    botAuditChannel = await guild.channels.create({
      name: botAuditChannelName,
      type: ChannelType.GuildText,
      topic: 'Bot logging and audit trail',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: modRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        },
      ],
      position: 0, // Keep it at the top
    });

    logger.info('Created bot-audit channel', true);
  }

  // Registration channel
  const registrationChannelName = config.channelPrefixes.registration;
  let registrationChannel = guild.channels.cache.find(ch => ch.name === registrationChannelName) as
    | TextChannel
    | undefined;

  if (!registrationChannel) {
    registrationChannel = await guild.channels.create({
      name: registrationChannelName,
      type: ChannelType.GuildText,
      topic: 'Register for a hackathon team here',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        },
      ],
      position: 1, // Keep it at the top
    });

    // Send registration instructions
    const { embed, components } = createRegistrationEmbed();

    await registrationChannel.send({
      embeds: [embed],
      components,
    });

    logger.info('Created registration channel', true);
  }

  // Mod-log channel
  const modLogChannelName = config.channelPrefixes.modLog;
  let modLogChannel = guild.channels.cache.find(ch => ch.name === modLogChannelName) as TextChannel | undefined;

  if (!modLogChannel) {
    modLogChannel = await guild.channels.create({
      name: modLogChannelName,
      type: ChannelType.GuildText,
      topic: 'Registration approval log',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: modRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
      position: 2, // Keep it at the top but after registration
    });

    logger.info('Created mod-log channel', true);
  }
}

// Create team voice channels in Discord
async function createTeamVoiceChannels(guild: Guild): Promise<void> {
  logger.info('Creating team voice channels...', true);

  // Maximum number of channels per category (Discord limit is 50)
  const MAX_CHANNELS_PER_CATEGORY = 50; // Using slightly below the limit for safety
  const totalTeams = teamNames.length;
  const categoriesNeeded = Math.ceil(totalTeams / MAX_CHANNELS_PER_CATEGORY);

  logger.info(`Need to create ${categoriesNeeded} categories for ${totalTeams} teams`, true);

  // Get the highest position of existing channels for placing categories at the bottom
  const highestPosition = Math.max(
    ...guild.channels.cache.filter((ch: any) => ch.position).map((ch: any) => ch.position),
    0,
  );

  // Create all needed categories first
  const categories = [];

  // Force a complete fetch of all guild channels
  const fetchedChannels = await guild.channels.fetch();

  for (let i = 0; i < categoriesNeeded; i++) {
    const categoryName = i === 0 ? config.categoryNames.teamVoice : `${config.categoryNames.teamVoice} ${i + 1}`;

    // Function to normalize category names (remove all emojis and trim whitespace)
    const normalizeText = (text: string): string => {
      // Remove all emojis completely, including variation selectors
      return text
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '')
        .replace(/[\u{1F300}-\u{1F6FF}]/gu, '')
        .replace(/\s+/g, ' ') // normalize multiple spaces to single space
        .trim();
    };

    // Normalize the name we're searching for
    const normalizedSearchName = normalizeText(categoryName);

    // Use the fetched channels directly with a more flexible comparison
    let category = fetchedChannels.find(ch => {
      if (ch === null || ch.type !== ChannelType.GuildCategory) return false;

      // Try exact match first
      if (ch.name === categoryName) return true;

      // Try normalized comparison
      const normalizedChannelName = normalizeText(ch.name);

      // Do a basic text comparison after normalization
      return (
        normalizedChannelName === normalizedSearchName ||
        (normalizedChannelName.includes('Team Voice Channels') &&
          ((i === 0 &&
            !normalizedChannelName.includes('2') &&
            !normalizedChannelName.includes('3') &&
            !normalizedChannelName.includes('4')) ||
            normalizedChannelName.includes(`${i + 1}`)))
      );
    });

    if (category) {
      logger.info(`Voice channel category "${categoryName}" already exists with ID: ${category.id}`, true);
      logger.info(`Found existing category with name: "${category.name}"`, true);
    } else {
      logger.info(`No existing category found for "${categoryName}", creating new one...`, true);
      await sleep(400);
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        position: highestPosition + i + 1, // Place at the bottom of the channel list
      });
      logger.info(`Created voice channel category: "${categoryName}" with ID: ${category.id}`, true);
    }

    categories.push(category);
  }

  // Distribute team channels across categories
  for (const [i, teamName] of teamNames.entries()) {
    await sleep(400);
    const categoryIndex = Math.floor(i / MAX_CHANNELS_PER_CATEGORY);
    const category = categories[categoryIndex];

    // Create a pretty channel name with number formatting and emoji
    const channelName = `🔊 Team ${teamName}`;
    const roleName = `${config.rolePrefix}${teamName}`;

    // Find the team role
    const teamRole = guild.roles.cache.find(r => r.name === roleName);

    if (!teamRole) {
      logger.error(`Could not find team role for ${teamName}`);
      continue;
    }

    // Function to normalize channel names (remove emojis and trim whitespace)
    const normalizeText = (text: string): string => {
      // Remove all emojis completely, including variation selectors
      return text
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '')
        .replace(/[\u{1F300}-\u{1F6FF}]/gu, '')
        .replace(/\s+/g, ' ') // normalize multiple spaces to single space
        .trim();
    };
    const normalizedSearchName = normalizeText(channelName);

    // Check if channel already exists using more flexible comparison
    let voiceChannel = fetchedChannels.find(ch => {
      if (ch === null || ch.type !== ChannelType.GuildVoice) return false;

      // Try exact match first
      if (ch.name === channelName) return true;

      // Try normalized comparison
      const normalizedChannelName = normalizeText(ch.name);

      // Compare the normalized names
      return (
        normalizedChannelName === normalizedSearchName ||
        (normalizedChannelName.includes('Team') && normalizedChannelName.includes(teamName))
      );
    });

    if (voiceChannel) {
      logger.info(`Voice channel for ${teamName} already exists with ID: ${voiceChannel.id}`, true);
    } else {
      // Create private voice channel under the category
      voiceChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: teamRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
        ],
      });

      logger.info(`Created voice channel for ${teamName} with ID: ${voiceChannel.id}`, true);
    }
  }
}

// Generate a random Discord color
function generateRandomColor(): number {
  return Math.floor(Math.random() * 0xffffff);
}
