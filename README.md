# Hackathon Discord Bot

A TypeScript-based Discord bot for managing an online hackathon on Discord, built with discord.js v14 and MongoDB (Mongoose).

## Features

### Setup and Teardown

- `/setup` - Administrator command to set up the hackathon Discord server
  - Creates MongoDB Team schema/model with team names
  - Creates Discord roles for each team
  - Creates private voice channels for teams
  - Creates registration and mod-log channels
- `/teardown` - Administrator command to remove all hackathon setup
  - Removes team roles
  - Deletes team channels
  - Cleans up database entries

### Registration System

- `/register` - Allows users to register for a team
  - Opens a modal for name and team selection
  - Notifies moderators of new registrations
  - Handles rate limiting to prevent spam
- `/unregister` - Allows users to leave their current team

### Moderation

- Approve/Reject buttons for moderators
- DM notifications for users when their requests are handled
- Mod-log channel for transparent registration tracking
- `/registrations` - Shows registration statistics for moderators

### Team Management

- `/teams` - View team information and member counts
- Private voice channels for team collaboration

### System Monitoring

- `/health` - Comprehensive health check for the bot and database systems
  - Shows Discord API latency and connection status
  - Shows database connection status and response time
  - Returns overall system health status
- `/ping` - Quick latency check for Discord connection
- Audit logging for all major actions
- Graceful shutdown handling

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   yarn install
   ```
3. Create a `.env` file with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   MONGODB_URI=your_mongodb_connection_string_here
   GUILD_ID=your_guild_id_here
   CLIENT_ID=your_bot_client_id_here
   ```
4. Build the project:
   ```
   yarn build
   ```
5. Deploy slash commands:
   ```
   yarn deploy
   ```
6. Start the bot:
   ```
   yarn start
   ```

## Development

- Run in development mode with hot reloading:
  ```
  yarn dev
  ```
- Format code with Prettier:
  ```
  yarn format
  ```
- Run linting:
  ```
  yarn lint
  ```
- Run tests:
  ```
  yarn test
  ```

## Customization

You can customize team names and channel prefixes by editing the `src/config/constants.ts` file.

## Requirements

- Node.js 16.9.0 or higher
- MongoDB database
- Discord Bot token with proper intents enabled (Gateway Intents: Server Members, Message Content)
