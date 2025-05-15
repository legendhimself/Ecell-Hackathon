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

import { TextChannel, Client } from 'discord.js';
import { config } from '../config/constants';

// Logger interface
interface ILogger {
  info(message: string, skipDiscord?: boolean, ...args: unknown[]): void;
  error(message: string, skipDiscord?: boolean, ...args: unknown[]): void;
  warn(message: string, skipDiscord?: boolean, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

class Logger implements ILogger {
  private botAuditChannel: TextChannel | null = null;

  constructor() {
    this.botAuditChannel = null;
  }

  // Initialize the logger with the Discord client to get the audit channel
  public initialize(client: Client): void {
    try {
      const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
      if (guild) {
        const auditChannel = guild.channels.cache.find(
          channel => channel.name === config.channelPrefixes.botAudit,
        ) as TextChannel;

        if (auditChannel) {
          this.botAuditChannel = auditChannel;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initializing logger:', error);
    }
  }

  private logToConsole(level: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
  }

  private async logToChannel(level: string, message: string, skipDiscord: boolean = false): Promise<void> {
    if (this.botAuditChannel && !skipDiscord) {
      try {
        await this.botAuditChannel.send(`[${level}] ${message}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error logging to audit channel:', error);
      }
    }
  }

  public info(message: string, skipDiscord: boolean = false, ...args: unknown[]): void {
    this.logToConsole('INFO', message, ...args);
    this.logToChannel('INFO', message, skipDiscord);
  }

  public error(message: string, skipDiscord: boolean = false, ...args: unknown[]): void {
    this.logToConsole('ERROR', message, ...args);
    this.logToChannel('ERROR', message, skipDiscord);
  }

  public warn(message: string, skipDiscord: boolean = false, ...args: unknown[]): void {
    this.logToConsole('WARN', message, ...args);
    this.logToChannel('WARN', message, skipDiscord);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.logToConsole('DEBUG', message, ...args);
    // Only log to console for debug, not to channel
  }
}

// Export a singleton instance of the logger
export const logger = new Logger();
