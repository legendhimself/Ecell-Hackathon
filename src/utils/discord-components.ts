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
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { teamNames } from '../config/constants';

// Button IDs
export enum ButtonIds {
  APPROVE_REGISTRATION = 'approve-registration',
  REJECT_REGISTRATION = 'reject-registration',
  REGISTER_TEAM = 'register-team',
}

// Modal IDs
export enum ModalIds {
  REGISTRATION = 'registration-modal',
  REJECTION_REASON = 'rejection-reason-modal',
}

// Create registration modal
export const createRegistrationModal = (): ModalBuilder => {
  const modal = new ModalBuilder().setCustomId(ModalIds.REGISTRATION).setTitle('Team Registration');

  // Full name input
  const fullNameInput = new TextInputBuilder()
    .setCustomId('fullName')
    .setLabel('Full Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter your full name')
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(50);

  // Team selection input - since we can't have a select menu in a modal,
  // we'll create a text input and validate it against team names with fuzzy search
  const teamInput = new TextInputBuilder()
    .setCustomId('teamName')
    .setLabel('Team Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter a team name (fuzzy search enabled)')
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  // Create action rows
  const fullNameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(fullNameInput);
  const teamRow = new ActionRowBuilder<TextInputBuilder>().addComponents(teamInput);

  // Add inputs to modal
  modal.addComponents(fullNameRow, teamRow);

  return modal;
};

// Create rejection reason modal
export const createRejectionModal = (userId: string): ModalBuilder => {
  const modal = new ModalBuilder().setCustomId(`${ModalIds.REJECTION_REASON}_${userId}`).setTitle('Rejection Reason');

  // Reason input
  const reasonInput = new TextInputBuilder()
    .setCustomId('rejectionReason')
    .setLabel('Reason for Rejection')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Please provide a reason for rejecting this registration')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000);

  // Create action row
  const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);

  // Add input to modal
  modal.addComponents(reasonRow);

  return modal;
};

// Create team select menu
export const createTeamSelectMenu = (): ActionRowBuilder<StringSelectMenuBuilder> => {
  const options = teamNames.map(team => new StringSelectMenuOptionBuilder().setLabel(team).setValue(team));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('teamSelect')
    .setPlaceholder('Select a team')
    .addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
};

// Create approval/rejection buttons
export const createModeratorButtons = (userId: string): ActionRowBuilder<ButtonBuilder> => {
  const approveButton = new ButtonBuilder()
    .setCustomId(`${ButtonIds.APPROVE_REGISTRATION}_${userId}`)
    .setLabel('Approve')
    .setStyle(ButtonStyle.Success);

  const rejectButton = new ButtonBuilder()
    .setCustomId(`${ButtonIds.REJECT_REGISTRATION}_${userId}`)
    .setStyle(ButtonStyle.Danger)
    .setLabel('Reject');

  return new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton, rejectButton);
};

// Create welcome embed
export const createWelcomeEmbed = (): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Welcome to the Hackathon Discord Server!')
    .setDescription("We're excited to have you join us for this event!")
    .addFields(
      {
        name: 'Getting Started',
        value: 'Please register for a team using the `/register` command or by visiting the registration channel.',
      },
      {
        name: 'Team Registration',
        value:
          "You'll be able to choose from available teams. Once approved by a moderator, you'll get access to your team's private voice channel.",
      },
    )
    .setTimestamp()
    .setFooter({ text: 'Hackathon Bot' });
};
