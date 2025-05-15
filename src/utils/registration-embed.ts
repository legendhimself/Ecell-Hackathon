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
        name: 'Team List (copy one of these)',
        value: formatTeamList(teamNames),
      },
    )
    .setFooter({ text: "If you make a typo, we'll try to match to the closest team name" })
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

// Format team names in chunks to avoid Discord's 1024 character field limit
function formatTeamList(teams: string[]): string {
  const sortedTeams = [...teams].sort((a, b) => a.localeCompare(b));

  // Each chunk will contain multiple teams
  const chunks: string[] = [];
  let currentChunk = '';

  for (const team of sortedTeams) {
    const teamEntry = `\`${team}\`, `;

    // If adding this team would exceed Discord's limit, start a new chunk
    if (currentChunk.length + teamEntry.length > 1_000) {
      chunks.push(currentChunk);
      currentChunk = teamEntry;
    } else currentChunk += teamEntry;
  }

  // Add the last chunk if not empty
  if (currentChunk.length > 0) chunks.push(currentChunk);

  // If we have multiple chunks, return them separated; otherwise return the single chunk
  return chunks.length > 1
    ? chunks.map((chunk, index) => `**Part ${index + 1}:**\n${chunk.slice(0, -2)}`).join('\n\n')
    : currentChunk.slice(0, -2);
}
