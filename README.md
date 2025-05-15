# Hackathon Discord Bot

A TypeScript-based Discord bot for managing an online hackathon on Discord, built with discord.js v14 and MongoDB (Mongoose).

## Features

### Setup

- `/setup` - Administrator command to set up the hackathon Discord server
  - Creates MongoDB Team schema/model with team names
  - Creates Discord roles for each team
  - Creates private voice channels for teams
  - Creates registration and mod-log channels

### Registration System

- `/register` - Allows users to register for a team
  - Opens a modal for name and team selection
  - Notifies moderators of new registrations
  - Handles rate limiting to prevent spam

### Moderation

- Approve/Reject buttons for moderators
- DM notifications for users when their requests are handled
- Mod-log channel for transparent registration tracking

### Team Management

- `/teams` - View team information and member counts
- `/unregister` - Leave your current team
- Private voice channels for team collaboration

### Utilities

- `/ping` - Health check command and latency information
- Audit logging for all major actions
- Graceful shutdown handling

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   npm install
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
   npm run build
   ```
5. Deploy slash commands:
   ```
   npm run deploy
   ```
6. Start the bot:
   ```
   npm start
   ```

## Development

- Run in development mode:
  ```
  npm run dev
  ```

## Customization

You can customize team names and channel prefixes by editing the `src/config/constants.ts` file.

## Requirements

- Node.js 16.9.0 or higher
- MongoDB database
- Discord Bot token with proper intents enabled
