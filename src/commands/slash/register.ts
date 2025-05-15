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
  TextChannel,
  ModalSubmitInteraction,
  PermissionFlagsBits,
} from 'discord.js';

import { config, teamNames } from '../../config/constants';
import { RegistrationRequest, RegistrationStatus } from '../../models/RegistrationRequest';
import { createRegistrationModal, createModeratorButtons } from '../../utils/discord-components';
import { logger } from '../../utils/logger';
import { RateLimiter } from '../../utils/rate-limiter';

// Create a rate limiter instance for registrations
const registrationLimiter = new RateLimiter(config.rateLimits.registration);

// The register command for team registration
export const registerCommand = {
  data: new SlashCommandBuilder().setName('register').setDescription('Register for a hackathon team'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const userId = interaction.user.id;

      // Check if user is already registered or has a pending request
      const existingRegistration = await RegistrationRequest.findOne({
        userId,
        status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.APPROVED] },
      });

      if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.PENDING) {
          await interaction.reply({
            content: 'You already have a pending registration request. Please wait for a moderator to review it.',
            flags: 'Ephemeral',
          });
          return;
        } else if (existingRegistration.status === RegistrationStatus.APPROVED) {
          await interaction.reply({
            content: `You're already registered with team ${existingRegistration.teamName}!`,
            flags: 'Ephemeral',
          });
          return;
        }
      }

      // Check for rate limiting - bypass for admins
      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        const rateLimit = registrationLimiter.checkRateLimit(userId);
        if (!rateLimit.allowed) {
          const remainingSeconds = Math.ceil(rateLimit.remainingTime / 1_000);
          await interaction.reply({
            content: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before trying to register again.`,
            flags: 'Ephemeral',
          });
          return;
        }
      }

      // Show registration modal
      const modal = createRegistrationModal();
      await interaction.showModal(modal);

      logger.debug(`Showed registration modal to user ${userId}`);
    } catch (error) {
      logger.error(`Error in register command: ${error}`);
      await interaction.reply({
        content: 'An error occurred while processing your registration. Please try again later.',
        flags: 'Ephemeral',
      });
    }
  },
};

// Process registration modal submission
export const processRegistration = async (interaction: ModalSubmitInteraction): Promise<void> => {
  try {
    // Get the form data
    const fullName = interaction.fields.getTextInputValue('fullName');
    const teamNumber = interaction.fields.getTextInputValue('teamName');
    const userId = interaction.user.id;

    // Validate that the team number exists in our list
    if (!teamNames.includes(teamNumber)) {
      await interaction.reply({
        content: `Invalid team number. Please try again with a valid team number. You entered: "${teamNumber}"`,
        flags: 'Ephemeral',
      });
      return;
    }

    // Proceed with registration
    await processTeamRegistration(interaction, userId, fullName, teamNumber);
  } catch (error) {
    logger.error(`Error processing registration: ${error}`);

    // Check if the interaction has already been replied to
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'An error occurred while processing your registration. Please try again later.',
        flags: 'Ephemeral',
      });
    } else {
      await interaction.reply({
        content: 'An error occurred while processing your registration. Please try again later.',
        flags: 'Ephemeral',
      });
    }
  }
};

// Process the actual team registration after validation and confirmation
async function processTeamRegistration(
  interaction: ModalSubmitInteraction,
  userId: string,
  fullName: string,
  teamName: string,
): Promise<void> {
  // Check for any existing rejected registrations and delete them first
  await sleep(400); // Adding sleep to avoid rate limiting
  await RegistrationRequest.deleteMany({ userId, status: RegistrationStatus.REJECTED });

  // Create registration request
  const registrationRequest = new RegistrationRequest({
    userId,
    fullName,
    teamName,
    status: RegistrationStatus.PENDING,
  });

  await sleep(400); // Adding sleep to avoid rate limiting
  await registrationRequest.save();

  logger.info(`New registration request from ${fullName} (${userId}) for team ${teamName}`);

  // Send notification to mod-log channel
  const guild = interaction.guild;
  const modLogChannel = guild?.channels.cache.find(ch => ch.name === config.channelPrefixes.modLog) as
    | TextChannel
    | undefined;

  if (modLogChannel) {
    const moderatorRole = guild?.roles.cache.find(r => r.name === config.moderatorRoleName);
    const moderatorMention = moderatorRole ? `<@&${moderatorRole.id}>` : '@Moderators';

    // Send message with approve/reject buttons
    const buttons = createModeratorButtons(userId);

    await modLogChannel.send({
      content: `${moderatorMention} New registration request:\n\n**User:** <@${userId}>\n**Name:** ${fullName}\n**Team:** ${teamName}`,
      components: [buttons],
    });
  }

  // Reply to the user
  if (interaction.replied) {
    await interaction.followUp({
      content: `Your registration request for team **${teamName}** has been submitted! A moderator will review it shortly.`,
      flags: 'Ephemeral',
    });
  } else {
    await interaction.reply({
      content: `Your registration request for team **${teamName}** has been submitted! A moderator will review it shortly.`,
      flags: 'Ephemeral',
    });
  }
}
