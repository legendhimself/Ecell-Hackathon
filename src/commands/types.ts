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

import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}
