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

import { Client, Events, GuildMember, type Interaction, ModalSubmitInteraction, TextChannel } from 'discord.js';

import { handleRegisterButton } from '../buttons/register-button';
import { handleButtonInteraction } from '../buttons/registration-handlers';
import { commands } from '../commands';
import { processRegistration } from '../commands/slash/register';
import { RegistrationRequest, RegistrationStatus } from '../models/RegistrationRequest';
import { closeDatabaseConnection } from '../utils/database';
import { ModalIds, createWelcomeEmbed } from '../utils/discord-components';
import { logger } from '../utils/logger';

// Initialize event handlers
export const initializeEvents = (client: Client): void => {
  // Ready event
  client.once(Events.ClientReady, () => {
    logger.info(`Logged in as ${client.user?.tag}`);

    // Initialize logger with client for audit channel
    logger.initialize(client);
  });

  // Handle interactions (commands, buttons, modals)
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);

        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
          await command.execute(interaction, client);
        } catch (error: any) {
          logger.error(`Error executing command ${interaction.commandName}:`, error);

          const reply = {
            content: 'There was an error while executing this command!',
            ephemeral: true,
          };

          if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
          else await interaction.reply(reply);
        }
      }
      // Handle button interactions
      else if (interaction.isButton()) {
        // Check for registration approval/rejection buttons
        if (
          interaction.customId.startsWith('approve-registration_') ||
          interaction.customId.startsWith('reject-registration_')
        )
          await handleButtonInteraction(interaction, client);
        // Check for register button
        else if (interaction.customId === 'register-team') await handleRegisterButton(interaction);
      }
      // Handle modal submit interactions
      else if (interaction.isModalSubmit()) {
        // Check for registration modal
        if (interaction.customId === ModalIds.REGISTRATION) await processRegistration(interaction);
        // Check for rejection reason modal
        else if (interaction.customId.startsWith(`${ModalIds.REJECTION_REASON}_`))
          await handleRejectionModalSubmit(interaction, client);
      }
    } catch (error: any) {
      logger.error('Error handling interaction:', error);
    }
  });

  // Handle new members joining the server
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    try {
      // Send welcome DM with registration info
      try {
        const welcomeEmbed = createWelcomeEmbed();
        await member.send({ embeds: [welcomeEmbed] });
        logger.info(`Sent welcome DM to new member ${member.id}`);
      } catch (error: any) {
        logger.error(`Failed to send welcome DM to ${member.id}:`, error);

        // Try to send in general channel if DM fails
        const generalChannel = member.guild.channels.cache.find(
          channel => channel.name === 'general' || channel.name === 'welcome' || channel.name === 'chat',
        ) as TextChannel | undefined;

        if (generalChannel) {
          const welcomeEmbed = createWelcomeEmbed();
          await generalChannel.send({
            content: `Welcome <@${member.id}>!`,
            embeds: [welcomeEmbed],
          });
        }
      }
    } catch (error: any) {
      logger.error('Error handling new member:', error);
    }
  });

  // client.on(Events.Debug, (info: string) => {
  //   logger.debug(`Debug info: ${info}`);
  // });

  // Handle process exit (for graceful shutdown)
  process.on('SIGINT', () => handleShutdown(client));
  process.on('SIGTERM', () => handleShutdown(client));
};

// Handle rejection modal submission
async function handleRejectionModalSubmit(interaction: ModalSubmitInteraction, client: Client): Promise<void> {
  try {
    // Get the user ID from the modal custom ID
    const userId = interaction.customId.split('_').pop();
    if (!userId) {
      await interaction.reply({ content: 'Invalid rejection modal', flags: 'Ephemeral' });
      return;
    }

    // Get the rejection reason
    const rejectionReason = interaction.fields.getTextInputValue('rejectionReason');

    // Find the registration request
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

    // Update registration status
    registrationRequest.status = RegistrationStatus.REJECTED;
    registrationRequest.rejectionReason = rejectionReason;
    await registrationRequest.save(); // Send DM to the user

    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (user) {
        await user.send(
          `Your registration request for team **${registrationRequest.teamName}** has been rejected.\n\n` +
            `**Reason:** ${rejectionReason}\n\n` +
            'You can register for a different team using the `/register` command.',
        );
      }
    } catch (error: any) {
      logger.error(`Failed to send rejection DM to user ${userId}:`, false, error);
    }

    // Edit the original message to show it's been rejected
    const message = interaction.message;
    if (message) {
      await message.edit({
        content: `Registration request for <@${userId}> (${registrationRequest.fullName}) for team **${registrationRequest.teamName}** has been **REJECTED** by <@${interaction.user.id}>.\n\n**Reason:** ${rejectionReason}`,
        components: [], // Remove the buttons
      });
    }

    logger.info(`Registration rejected for user ${userId} by moderator ${interaction.user.id}`, false);

    // Reply to the moderator
    await interaction.reply({ content: 'Registration request has been rejected.', flags: 'Ephemeral' });
  } catch (error: any) {
    logger.error('Error handling rejection modal:', false, error);
    await interaction.reply({ content: 'An error occurred while processing the rejection.', flags: 'Ephemeral' });
  }
}

// Graceful shutdown function
async function handleShutdown(client: Client): Promise<void> {
  logger.info('Received shutdown signal. Shutting down gracefully...');

  // Destroy the client connection
  void client.destroy();

  // Close database connection
  await closeDatabaseConnection();

  // Exit with success code
  logger.info('Shutdown complete.');
  process.exit(0);
}
