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

import { ButtonInteraction } from 'discord.js';

import { ButtonIds, createRegistrationModal } from '../utils/discord-components';
import { logger } from '../utils/logger';

// Handle register button click
export const handleRegisterButton = async (interaction: ButtonInteraction): Promise<void> => {
  try {
    if (interaction.customId === ButtonIds.REGISTER_TEAM) {
      // Show registration modal
      const modal = createRegistrationModal();
      await interaction.showModal(modal);

      logger.debug(`Showed registration modal to user ${interaction.user.id}`);
    }
  } catch (error) {
    logger.error(`Error handling register button: ${error}`);
    await interaction.reply({
      content: 'There was an error processing your registration. Please try again.',
      flags: 'Ephemeral',
    });
  }
};
