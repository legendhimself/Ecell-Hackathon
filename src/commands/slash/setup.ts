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
import { setTimeout as sleep } from 'node:timers/promises';
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

    if (!existingTeam) {
      await sleep(400); // Adding sleep to avoid rate limiting
      // Create new team
      await Team.create({ teamName, members: [] });
      logger.info(`Created team model for ${teamName}`, true);
    } else {
      logger.info(`Team model for ${teamName} already exists`, true);
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

    if (!role) {
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
    } else {
      logger.info(`Role for ${teamName} already exists`, true);
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
    });

    logger.info('Created Moderators role', true);
  }

  // Bot-audit channel
  const botAuditChannelName = config.channelPrefixes.botAudit;
  let botAuditChannel = guild.channels.cache.find(ch => ch.name === botAuditChannelName) as TextChannel;

  if (!botAuditChannel) {
    botAuditChannel = (await guild.channels.create({
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
    })) as TextChannel;

    logger.info('Created bot-audit channel', true);
  }

  // Registration channel
  const registrationChannelName = config.channelPrefixes.registration;
  let registrationChannel = guild.channels.cache.find(ch => ch.name === registrationChannelName) as TextChannel;

  if (!registrationChannel) {
    registrationChannel = (await guild.channels.create({
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
    })) as TextChannel;

    // Send registration instructions
    const { createRegistrationEmbed } = await import('../../utils/registration-embed');
    const { embed, components } = createRegistrationEmbed();

    await registrationChannel.send({
      embeds: [embed],
      components,
    });

    logger.info('Created registration channel', true);
  }

  // Mod-log channel
  const modLogChannelName = config.channelPrefixes.modLog;
  let modLogChannel = guild.channels.cache.find(ch => ch.name === modLogChannelName) as TextChannel;

  if (!modLogChannel) {
    modLogChannel = (await guild.channels.create({
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
    })) as TextChannel;

    logger.info('Created mod-log channel', true);
  }
}

// Create team voice channels in Discord
async function createTeamVoiceChannels(guild: Guild): Promise<void> {
  logger.info('Creating team voice channels...', true);

  // Create a category for team voice channels if it doesn't exist
  let category = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory && ch.name === config.categoryNames.teamVoice,
  );

  if (!category) {
    category = await guild.channels.create({
      name: config.categoryNames.teamVoice,
      type: ChannelType.GuildCategory,
    });
    logger.info(`Created voice channel category: ${config.categoryNames.teamVoice}`, true);
  }

  for (const teamName of teamNames) {
    await sleep(400);

    // Create a pretty channel name with PascalCase and emoji
    const prettyTeamName = teamName
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    const channelName = `🔊 ${prettyTeamName}`;
    const roleName = `${config.rolePrefix}${teamName}`;

    // Find the team role
    const teamRole = guild.roles.cache.find(r => r.name === roleName);

    if (!teamRole) {
      logger.error(`Could not find team role for ${teamName}`);
      continue;
    }

    // Check if channel already exists
    let voiceChannel = guild.channels.cache.find(ch => ch.name === channelName);

    if (!voiceChannel) {
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

      logger.info(`Created voice channel for ${teamName}`, true);
    } else {
      logger.info(`Voice channel for ${teamName} already exists`, true);
    }
  }
}

// Generate a random Discord color
function generateRandomColor(): number {
  return Math.floor(Math.random() * 0xffffff);
}
