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

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RegistrationRequest, RegistrationStatus } from '../../models/RegistrationRequest';
import { Team } from '../../models/Team';
import { logger } from '../../utils/logger';
import { config } from '../../config/constants';
import { setTimeout as sleep } from 'node:timers/promises';

// The unregister command for leaving a team
export const unregisterCommand = {
  data: new SlashCommandBuilder().setName('unregister').setDescription('Leave your current hackathon team'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const userId = interaction.user.id;

      // Check if user is registered to a team
      const registration = await RegistrationRequest.findOne({
        userId,
        status: RegistrationStatus.APPROVED,
      });

      if (!registration) {
        await interaction.reply({
          content: "You're not currently registered with any team.",
          flags: 'Ephemeral',
        });
        return;
      }

      const teamName = registration.teamName;

      // Get the guild and check if it exists
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({
          content: 'This command can only be used in a server.',
          flags: 'Ephemeral',
        });
        return;
      }

      // Remove role from user
      const member = guild.members.cache.get(userId);
      if (member) {
        const roleName = `${config.rolePrefix}${teamName}`;
        const role = guild.roles.cache.find(r => r.name === roleName);

        if (role) {
          await sleep(400); // Adding sleep to avoid rate limiting
          await member.roles.remove(role);
        }
      }

      // Remove user from team in database
      await sleep(400); // Adding sleep to avoid rate limiting
      await Team.updateOne({ teamName }, { $pull: { members: userId } });

      // Update registration status
      await RegistrationRequest.deleteMany({ userId });
      await sleep(400); // Adding sleep to avoid rate limiting

      logger.info(`User ${userId} unregistered from team ${teamName}`);

      // Reply to the user
      await interaction.reply({
        content: `You have successfully left team **${teamName}**. You can register for a new team with the \`/register\` command.`,
        flags: 'Ephemeral',
      });
    } catch (error) {
      logger.error(`Error in unregister command: ${error}`);
      await interaction.reply({
        content: 'An error occurred while trying to unregister. Please try again later.',
        flags: 'Ephemeral',
      });
    }
  },
};
