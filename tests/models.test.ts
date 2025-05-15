import process from 'node:process';

import mongoose from 'mongoose';

import { teamNames } from '../src/config/constants';
import { RegistrationRequest, RegistrationStatus } from '../src/models/RegistrationRequest';
import { Team } from '../src/models/Team';

describe('MongoDB Models', () => {
  // Connect to a test database before tests
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/hackathon-test';
    await mongoose.connect(mongoUri);
  });

  // Clean up after tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Team Model', () => {
    afterEach(async () => {
      await Team.deleteMany({});
    });

    it('should create a team with valid data', async () => {
      const teamData = {
        teamName: teamNames[0],
        members: ['user1', 'user2'],
      };

      const team = await Team.create(teamData);
      expect(team).toBeDefined();
      expect(team.teamName).toBe(teamData.teamName);
      expect(team.members).toHaveLength(2);
      expect(team.members).toContain('user1');
      expect(team.members).toContain('user2');
    });

    it('should not allow creating a team with invalid team name', async () => {
      const teamData = {
        teamName: 'InvalidTeamName',
        members: ['user1'],
      };

      await expect(Team.create(teamData)).rejects.toThrow();
    });
  });

  describe('RegistrationRequest Model', () => {
    afterEach(async () => {
      await RegistrationRequest.deleteMany({});
    });

    it('should create a registration request with valid data', async () => {
      const requestData = {
        userId: 'user123',
        fullName: 'John Doe',
        teamName: teamNames[0],
        status: RegistrationStatus.PENDING,
      };

      const request = await RegistrationRequest.create(requestData);
      expect(request).toBeDefined();
      expect(request.userId).toBe(requestData.userId);
      expect(request.fullName).toBe(requestData.fullName);
      expect(request.teamName).toBe(requestData.teamName);
      expect(request.status).toBe(RegistrationStatus.PENDING);
    });

    it('should not allow duplicate user registrations', async () => {
      const requestData = {
        userId: 'user123',
        fullName: 'John Doe',
        teamName: teamNames[0],
        status: RegistrationStatus.PENDING,
      };

      await RegistrationRequest.create(requestData);
      await expect(RegistrationRequest.create(requestData)).rejects.toThrow();
    });

    it('should update status correctly', async () => {
      const requestData = {
        userId: 'user456',
        fullName: 'Jane Doe',
        teamName: teamNames[1],
        status: RegistrationStatus.PENDING,
      };

      const request = await RegistrationRequest.create(requestData);
      request.status = RegistrationStatus.APPROVED;
      await request.save();

      const updatedRequest = await RegistrationRequest.findOne({ userId: 'user456' });
      expect(updatedRequest).toBeDefined();
      expect(updatedRequest?.status).toBe(RegistrationStatus.APPROVED);
    });
  });
});
