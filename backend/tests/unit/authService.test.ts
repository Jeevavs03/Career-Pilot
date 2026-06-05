import { authService } from '../../src/services/authService';
import { User } from '../../src/models/mongoose';

jest.mock('../../src/models/mongoose', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should throw if email exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@test.com' });
      await expect(authService.register('test@test.com', 'password', 'Test'))
        .rejects.toThrow('Email already registered');
    });

    it('should create user and return tokens', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123', email: 'new@test.com', name: 'New', profile: {},
      });
      const result = await authService.register('new@test.com', 'password123', 'New');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('new@test.com');
    });
  });

  describe('login', () => {
    it('should throw on invalid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.login('bad@test.com', 'wrong'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
