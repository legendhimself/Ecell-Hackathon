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

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { ButtonIds } from './discord-components';

import { teamNames } from '../config/constants';

// Create a registration embed with team selection
export const createRegistrationEmbed = (): { components: ActionRowBuilder<ButtonBuilder>[]; embed: EmbedBuilder } => {
  // Create the embed
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('📝 Team Registration')
    .setDescription(
      'Register for a hackathon team by clicking the button below. You will be prompted to enter your details.',
    )
    .addFields(
      {
        name: '🔍 Available Teams',
        value:
          'Here are all available teams you can join. You can copy one of these names or use a similar name (fuzzy search is enabled).',
      },
      {
        name: 'Team Range',
        value: `Please enter a team number between ${Math.min(...teamNames.map(t => Number.parseInt(t, 10)))} - ${Math.max(...teamNames.map(t => Number.parseInt(t, 10)))}.`,
      },
    )
    .setFooter({ text: 'If you make a typo, your application will be and you can register again.' })
    .setTimestamp();

  // Create the register button
  const registerButton = new ButtonBuilder()
    .setCustomId(ButtonIds.REGISTER_TEAM)
    .setLabel('Register for a Team')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(registerButton);

  return {
    embed,
    components: [row],
  };
};
