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

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { RegistrationRequest, RegistrationStatus } from '../../models/RegistrationRequest';
import { logger } from '../../utils/logger';

// The registrations command to show registration statistics
export const registrationsCommand = {
  data: new SlashCommandBuilder()
    .setName('registrations')
    .setDescription('Show registration statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Defer the reply
      await interaction.deferReply();

      // Get registration counts
      const totalCount = await RegistrationRequest.countDocuments();
      const pendingCount = await RegistrationRequest.countDocuments({ status: RegistrationStatus.PENDING });
      const approvedCount = await RegistrationRequest.countDocuments({ status: RegistrationStatus.APPROVED });
      const rejectedCount = await RegistrationRequest.countDocuments({ status: RegistrationStatus.REJECTED });

      // Get the newest registrations
      const recentRegistrations = await RegistrationRequest.find().sort({ createdAt: -1 }).limit(5);

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Registration Statistics')
        .addFields(
          { name: 'Total Registrations', value: totalCount.toString(), inline: true },
          { name: 'Pending', value: pendingCount.toString(), inline: true },
          { name: 'Approved', value: approvedCount.toString(), inline: true },
          { name: 'Rejected', value: rejectedCount.toString(), inline: true },
        )
        .setTimestamp();

      // Add recent registrations
      if (recentRegistrations.length > 0) {
        let recentText = '';

        for (const reg of recentRegistrations) {
          const statusEmoji =
            reg.status === RegistrationStatus.PENDING ? '⏳' : reg.status === RegistrationStatus.APPROVED ? '✅' : '❌';

          recentText += `${statusEmoji} <@${reg.userId}> - **${reg.fullName}** - Team: **${reg.teamName}**\n`;
        }

        embed.addFields({ name: 'Recent Registrations', value: recentText });
      }

      // Reply with the embed
      await interaction.editReply({ embeds: [embed] });
      logger.debug(`Registrations command executed by ${interaction.user.id}`);
    } catch (error) {
      logger.error(`Error in registrations command: ${error}`);
      await interaction.editReply('An error occurred while fetching registration information.');
    }
  },
};
