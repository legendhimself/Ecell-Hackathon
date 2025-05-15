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

import { Collection } from 'discord.js';

import { healthCommand } from './slash/health';
import { pingCommand } from './slash/ping';
import { registrationsCommand } from './slash/registrations';
import { setupCommand } from './slash/setup';
// import { registerCommand } from './slash/register';
import { teamsCommand } from './slash/teams';
import { teardownCommand } from './slash/teardown';
import { unregisterCommand } from './slash/unregister';

import { logger } from '../utils/logger';

import type { SlashCommand } from './types';

// Creating a collection of commands
const commands = new Collection<string, SlashCommand>();

// Add all commands to the collection
commands.set(setupCommand.data.name, setupCommand);
// commands.set(registerCommand.data.name, registerCommand);
commands.set(teamsCommand.data.name, teamsCommand as unknown as SlashCommand);
commands.set(unregisterCommand.data.name, unregisterCommand);
commands.set(pingCommand.data.name, pingCommand);
commands.set(healthCommand.data.name, healthCommand);
commands.set(registrationsCommand.data.name, registrationsCommand);
commands.set(teardownCommand.data.name, teardownCommand);
logger.debug(`Loaded ${commands.size} slash commands`);

export { commands };
