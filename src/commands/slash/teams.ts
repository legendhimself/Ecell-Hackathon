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

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Team } from '../../models/Team';
import { teamNames } from '../../config/constants';
import { logger } from '../../utils/logger';

// The teams command to show team information
export const teamsCommand = {
  data: new SlashCommandBuilder()
    .setName('teams')
    .setDescription('List teams participating in the hackathon')
    .addStringOption(option =>
      option
        .setName('list_all')
        .setDescription('List all available teams (default: false)')
        .addChoices({ name: 'True', value: 'true' }, { name: 'False', value: 'false' }),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Get the list_all option
      const listAll = interaction.options.getBoolean('list_all') || false;

      // Defer the reply
      await interaction.deferReply({ ephemeral: listAll });

      if (listAll) {
        // Show all available teams
        await showAllTeams(interaction);
      } else {
        // Show only teams with members
        await showTeamsWithMembers(interaction);
      }

      logger.debug(`Teams command executed by ${interaction.user.id}`);
    } catch (error) {
      logger.error(`Error in teams command: ${error}`);
      await interaction.editReply('An error occurred while fetching team information.');
    }
  },
};

// Show all available teams
async function showAllTeams(interaction: ChatInputCommandInteraction): Promise<void> {
  // Sort teams alphabetically
  const sortedTeams = [...teamNames].sort();

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('🔍 Available Hackathon Teams')
    .setDescription('Here are all teams available for registration. You can use these names when registering.')
    .setTimestamp();

  // Format team names in chunks to avoid Discord's 1024 character field limit
  const chunks: string[] = [];
  let currentChunk = '';

  for (const team of sortedTeams) {
    const teamEntry = `\`${team}\`\n`;

    // If adding this team would exceed Discord's limit, start a new chunk
    if (currentChunk.length + teamEntry.length > 1000) {
      chunks.push(currentChunk);
      currentChunk = teamEntry;
    } else {
      currentChunk += teamEntry;
    }
  }

  // Add the last chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // Add fields for each chunk
  chunks.forEach((chunk, index) => {
    embed.addFields({
      name: chunks.length > 1 ? `Teams (Part ${index + 1}/${chunks.length})` : 'Teams',
      value: chunk,
    });
  });

  // Reply with the embed
  await interaction.editReply({ embeds: [embed] });
}

// Show only teams with members
async function showTeamsWithMembers(interaction: ChatInputCommandInteraction): Promise<void> {
  // Get all teams with member counts
  const teams = await Team.find();

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('🏆 Hackathon Teams')
    .setDescription('Current team information and member counts')
    .setFooter({ text: 'Use /teams list_all:true to see all available teams' })
    .setTimestamp();

  // Add team information
  for (const team of teams) {
    embed.addFields({
      name: team.teamName,
      value: `${team.members.length} members`,
      inline: true,
    });
  }

  // Reply with the embed
  await interaction.editReply({ embeds: [embed] });
}
