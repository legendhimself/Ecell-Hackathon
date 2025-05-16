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

import { ButtonInteraction, Client } from 'discord.js';

import { RegistrationRequest, RegistrationStatus } from '../models/RegistrationRequest';
import { Team } from '../models/Team';
import { ButtonIds, createRejectionModal } from '../utils/discord-components';
import { logger } from '../utils/logger';

// Handle button interactions
export const handleButtonInteraction = async (interaction: ButtonInteraction, client: Client): Promise<void> => {
  // Extract the button ID and user ID from the custom ID
  const [buttonId, userId] = interaction.customId.split('_');
  try {
    if (buttonId === ButtonIds.APPROVE_REGISTRATION) await handleApproveRegistration(interaction, userId, client);
    else if (buttonId === ButtonIds.REJECT_REGISTRATION) await handleRejectRegistration(interaction, userId);
  } catch (error: any) {
    logger.error(`Error handling button interaction: ${error}`);

    // Check if the interaction has already been replied to
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({ content: 'There was an error processing your request.', flags: 'Ephemeral' });
    else await interaction.reply({ content: 'There was an error processing your request.', flags: 'Ephemeral' });
  }
};

// Handle approval of registration
async function handleApproveRegistration(
  interaction: ButtonInteraction,
  userId: string,
  client: Client,
): Promise<void> {
  // Defer the reply
  await interaction.deferUpdate();

  try {
    // Find the latest pending registration request for the user
    const registrationRequest = await RegistrationRequest.findOne(
      { userId, status: RegistrationStatus.PENDING },
      {},
      { sort: { createdAt: -1 } }, // Sort by creation date descending to get the most recent
    );

    if (!registrationRequest) {
      await interaction.followUp({
        content:
          'No pending registration request found for this user. They may have already been approved or rejected.',
        flags: 'Ephemeral',
      });
      return;
    }

    // Get the guild and member
    const guild = interaction.guild;
    if (!guild) {
      await interaction.followUp({ content: 'Unable to find guild.', flags: 'Ephemeral' });
      return;
    }

    // Try to find the member
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      await interaction.followUp({
        content: 'Unable to find member. They may have left the server.',
        flags: 'Ephemeral',
      });
      return;
    }

    // Find the team role by name
    const teamRoleName = `Team-${registrationRequest.teamName}`;
    const role = guild.roles.cache.find(r => r.name === teamRoleName);
    const participantRole = guild.roles.cache.find(r => r.id === '1370167939013021767');

    if (!role) {
      await interaction.followUp({ content: `Team role '${teamRoleName}' not found.`, flags: 'Ephemeral' });
      return;
    }

    // Assign the role
    await sleep(400); // Adding sleep to avoid rate limiting
    await member.roles.add([role, participantRole!]);

    // Update the registration request status
    await sleep(400); // Adding sleep to avoid rate limiting

    // First, let's clear out any other registrations this user might have
    await RegistrationRequest.updateMany(
      { userId, _id: { $ne: registrationRequest._id } },
      { status: RegistrationStatus.REJECTED, rejectionReason: 'Superseded by newer registration' },
    );

    registrationRequest.status = RegistrationStatus.APPROVED;
    await registrationRequest.save();

    // Add member to team
    await sleep(400); // Adding sleep to avoid rate limiting
    await Team.findOneAndUpdate({ teamName: registrationRequest.teamName }, { $addToSet: { members: userId } });

    // Find the team voice channel
    // Look for the voice channel based on the team name
    const prettyTeamName = registrationRequest.teamName
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    const voiceChannelName = `🔊 ${prettyTeamName}`;
    const voiceChannel = guild.channels.cache.find(ch => ch.name === voiceChannelName);

    // Send a DM to the user
    try {
      await sleep(400); // Adding sleep to avoid rate limiting
      const user = await client.users.fetch(userId).catch(() => null);
      if (user) {
        let message = `Congratulations! Your registration for team **${registrationRequest.teamName}** has been approved.`;

        if (voiceChannel) message += `\n\nYou can join your team's voice channel here: <#${voiceChannel.id}>`;

        await user.send(message);
      }
    } catch (error) {
      logger.error(`Failed to send DM to user ${userId}: ${error}`);
    }

    // Edit the original message to show it's been approved
    // Get the original message component
    const message = interaction.message;
    try {
      await message.edit({
        content: `Registration request for <@${userId}> (${registrationRequest.fullName}) for team **${registrationRequest.teamName}** has been **APPROVED** by <@${interaction.user.id}>.`,
        components: [], // Remove the buttons
      });
    } catch {
      await interaction.followUp({
        content: `Failed to update the original message, but registration for <@${userId}> has been approved successfully.`,
        flags: 'Ephemeral',
      });
    }

    logger.info(
      `Registration approved for user ${userId} on team ${registrationRequest.teamName} by moderator ${interaction.user.id}`,
    );
  } catch (error) {
    logger.error(`Error approving registration: ${error}`);
    await interaction.followUp({ content: 'There was an error processing the approval.', flags: 'Ephemeral' });
  }
}

// Handle rejection of registration
async function handleRejectRegistration(interaction: ButtonInteraction, userId: string): Promise<void> {
  try {
    // Find the latest pending registration request for the user
    const registrationRequest = await RegistrationRequest.findOne(
      { userId, status: RegistrationStatus.PENDING },
      {},
      { sort: { createdAt: -1 } }, // Sort by creation date descending to get the most recent
    );

    if (!registrationRequest) {
      await interaction.reply({
        content:
          'No pending registration request found for this user. They may have already been approved or rejected.',
        flags: 'Ephemeral',
      });
      return;
    }

    // Show rejection reason modal
    const modal = createRejectionModal(userId);
    await interaction.showModal(modal);
  } catch (error) {
    logger.error(`Error showing rejection modal: ${error}`);
    await interaction.reply({ content: 'There was an error processing the rejection.', flags: 'Ephemeral' });
  }
}
