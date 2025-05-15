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
  TextChannel,
  ModalSubmitInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { RegistrationRequest, RegistrationStatus } from '../../models/RegistrationRequest';
import { createRegistrationModal } from '../../utils/discord-components';
import { logger } from '../../utils/logger';
import { config, teamNames } from '../../config/constants';
import Fuse from 'fuse.js';
import { RateLimiter } from '../../utils/rate-limiter';
import { setTimeout as sleep } from 'node:timers/promises';

// Create a rate limiter instance for registrations
const registrationLimiter = new RateLimiter(config.rateLimits.registration);

// Create a fuzzy search instance for team names
const teamFuse = new Fuse(teamNames, {
  includeScore: true,
  threshold: 0.4, // Lower threshold means more strict matching
  minMatchCharLength: 2,
});

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
          const remainingSeconds = Math.ceil(rateLimit.remainingTime / 1000);
          await interaction.reply({
            content: `Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} before trying to register again.`,
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
    const enteredTeamName = interaction.fields.getTextInputValue('teamName');
    const userId = interaction.user.id;

    // Use fuzzy search to find the best match
    const results = teamFuse.search(enteredTeamName);

    // No matching team found
    if (results.length === 0) {
      await interaction.reply({
        content: `No matching team found. Please try again with a valid team name. You entered: "${enteredTeamName}"`,
        flags: 'Ephemeral',
      });
      return;
    }

    // Get the best match
    const bestMatch = results[0];
    const teamName = bestMatch.item;

    // If it's not a perfect match, confirm with the user
    if (enteredTeamName.toLowerCase() !== teamName.toLowerCase()) {
      // Reply asking for confirmation without auto-selecting
      await interaction.reply({
        content: `Did you mean to join team **${teamName}**? Your entry "${enteredTeamName}" was similar but not exact.\n\nPlease use the \`/register\` command again and enter the team name shown above if you want to join this team.`,
        flags: 'Ephemeral',
      });

      return;
    }

    // If it's an exact match, proceed with registration
    await processTeamRegistration(interaction, userId, fullName, teamName);
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
  const modLogChannel = guild?.channels.cache.find(ch => ch.name === config.channelPrefixes.modLog) as TextChannel;

  if (modLogChannel) {
    const moderatorRole = guild?.roles.cache.find(r => r.name === config.moderatorRoleName);
    const moderatorMention = moderatorRole ? `<@&${moderatorRole.id}>` : '@Moderators';

    // Send message with approve/reject buttons
    const { createModeratorButtons } = await import('../../utils/discord-components');
    const buttons = createModeratorButtons(userId);

    await modLogChannel.send({
      content: `${moderatorMention} New registration request:\n\n**User:** <@${userId}>\n**Name:** ${fullName}\n**Team:** ${teamName}`,
      components: [buttons],
    });
  }

  // Reply to the user
  if (!interaction.replied) {
    await interaction.reply({
      content: `Your registration request for team **${teamName}** has been submitted! A moderator will review it shortly.`,
      flags: 'Ephemeral',
    });
  } else {
    await interaction.followUp({
      content: `Your registration request for team **${teamName}** has been submitted! A moderator will review it shortly.`,
      flags: 'Ephemeral',
    });
  }
}
