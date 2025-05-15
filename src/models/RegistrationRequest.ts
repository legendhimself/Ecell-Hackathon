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

// Registration status enum
export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Registration request interface
export interface IRegistrationRequest extends Document {
  userId: string;
  fullName: string;
  teamName: string;
  status: RegistrationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Registration request schema
const RegistrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    userId: {
      type: String,
      required: true,
      // Remove unique constraint to allow re-registering after rejection
      // We'll handle this in the application logic instead
    },
    fullName: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      required: true,
      enum: teamNames,
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true },
);

// Export the RegistrationRequest model
export const RegistrationRequest = mongoose.model<IRegistrationRequest>(
  'RegistrationRequest',
  RegistrationRequestSchema,
);
