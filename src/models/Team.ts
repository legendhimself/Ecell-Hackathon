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

import mongoose, { Document, Schema } from 'mongoose';
import { teamNames } from '../config/constants';

// Team model interface
export interface ITeam extends Document {
  teamName: string;
  members: string[];
}

// Team schema
const TeamSchema = new Schema<ITeam>(
  {
    teamName: {
      type: String,
      required: true,
      unique: true,
      enum: teamNames,
    },
    members: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

// Export the Team model
export const Team = mongoose.model<ITeam>('Team', TeamSchema);
