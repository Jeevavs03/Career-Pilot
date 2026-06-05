import { User } from '../models/mongoose';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { AppError } from '../utils/response';
import { IUserProfile } from '../types';

const DEFAULT_PROFILE: IUserProfile = {
  experience: 1,
  targetRoles: ['Angular Developer', 'React Developer', 'MERN Stack Developer', 'Full Stack Developer', 'Node.js Developer', 'TypeScript Developer', 'Frontend Developer', 'Backend Developer', 'Software Engineer'],
  skills: {
    frontend: ['Angular', 'React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Angular Material'],
    backend: ['Node.js', 'Express.js'],
    database: ['MongoDB', 'MySQL', 'PostgreSQL'],
    tools: ['Git', 'GitHub', 'Docker', 'Postman'],
    orm: ['Mongoose', 'Sequelize', 'TypeORM'],
  },
  targetSalary: '7 LPA+',
  location: 'India',
  locations: ['India'],
  noticePeriod: 'Immediate',
  currentSalary: '',
  expectedSalary: '7 LPA',
};

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await User.findOne({ email });
    if (existing) throw new AppError(409, 'Email already registered');

    const user = await User.create({ email, password, name, profile: DEFAULT_PROFILE });
    const tokens = generateTokens(user._id.toString());
    return { user: { id: user._id, email: user.email, name: user.name, profile: user.profile }, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, 'Invalid credentials');
    }
    const tokens = generateTokens(user._id.toString());
    return { user: { id: user._id, email: user.email, name: user.name, profile: user.profile }, ...tokens };
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);
    if (!payload) throw new AppError(401, 'Invalid refresh token');
    return generateTokens(payload.userId);
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    // Backfill default profile if skills/targetRoles are empty (pre-existing users)
    const p = (user.profile as any) || {};
    const hasSkills = p.skills?.frontend?.length || p.skills?.backend?.length || p.skills?.database?.length || p.skills?.tools?.length || p.skills?.orm?.length;
    const hasRoles = p.targetRoles?.length;
    if (!hasSkills || !hasRoles) {
      const merged = {
        ...DEFAULT_PROFILE,
        ...p,
        skills: hasSkills ? p.skills : DEFAULT_PROFILE.skills,
        targetRoles: hasRoles ? p.targetRoles : DEFAULT_PROFILE.targetRoles,
        locations: p.locations?.length ? p.locations : DEFAULT_PROFILE.locations,
      };
      await User.findByIdAndUpdate(userId, { $set: { profile: merged } });
      const updated = await User.findById(userId).select('-password');
      return updated;
    }

    return user.toObject({ transform: (_doc: any, ret: any) => { delete ret.password; return ret; } });
  }

  async updateProfile(userId: string, data: any) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    // Deep merge profile fields
    const existing = (user.profile as any) || {};
    const incoming = data.profile || data;

    const merged = {
      experience: incoming.experience ?? existing.experience,
      targetRoles: incoming.targetRoles ?? existing.targetRoles,
      skills: {
        frontend: incoming.skills?.frontend ?? existing.skills?.frontend ?? [],
        backend: incoming.skills?.backend ?? existing.skills?.backend ?? [],
        database: incoming.skills?.database ?? existing.skills?.database ?? [],
        tools: incoming.skills?.tools ?? existing.skills?.tools ?? [],
        orm: incoming.skills?.orm ?? existing.skills?.orm ?? [],
      },
      targetSalary: incoming.targetSalary ?? existing.targetSalary,
      location: incoming.locations?.[0] ?? incoming.location ?? existing.location,
      locations: incoming.locations ?? existing.locations ?? [existing.location || 'India'],
      noticePeriod: incoming.noticePeriod ?? existing.noticePeriod,
      currentSalary: incoming.currentSalary ?? existing.currentSalary,
      expectedSalary: incoming.expectedSalary ?? existing.expectedSalary,
    };

    const updated = await User.findByIdAndUpdate(userId, { $set: { profile: merged } }, { new: true }).select('-password');
    return updated;
  }
}

export const authService = new AuthService();
