import { MatchingEngine } from '../../src/ai/matching';

// Mock ollama
jest.mock('../../src/ai/ollama', () => ({
  ollamaClient: {
    generate: jest.fn().mockResolvedValue('75'),
    embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  },
}));

describe('MatchingEngine', () => {
  const engine = new MatchingEngine();
  const mockProfile = {
    experience: 1,
    targetRoles: ['React Developer', 'Full Stack Developer', 'MERN Stack Developer'],
    skills: {
      frontend: ['React', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind'],
      backend: ['Node.js', 'Express.js'],
      database: ['MongoDB', 'PostgreSQL', 'MySQL'],
      tools: ['Git', 'Docker'],
      orm: ['Mongoose', 'TypeORM'],
    },
    targetSalary: '7 LPA+',
    location: 'India',
    noticePeriod: 'Immediate',
    currentSalary: '',
    expectedSalary: '7 LPA',
  };

  it('should score a matching React job highly', async () => {
    const job = {
      _id: '1', title: 'React Developer', company: 'TechCo', salary: '8 LPA',
      salaryMin: 8, salaryMax: 12, skills: ['React', 'TypeScript', 'Node.js'],
      experience: '0-2 years', experienceMin: 0, experienceMax: 2,
      description: 'React developer needed', url: 'http://test.com',
      location: 'India', source: 'linkedin' as const, datePosted: new Date(),
      dateCollected: new Date(), status: 'new' as const, matchScore: 0, isActive: true,
    };

    const result = await engine.calculateMatchScore(job, mockProfile);
    expect(result.overallScore).toBeGreaterThan(60);
    expect(result.roleMatch).toBe(100);
    expect(result.skillMatch).toBeGreaterThan(50);
  });

  it('should score a non-matching job low', async () => {
    const job = {
      _id: '2', title: 'Data Scientist', company: 'MLCo', salary: '15 LPA',
      salaryMin: 15, salaryMax: 25, skills: ['Python', 'TensorFlow', 'PyTorch'],
      experience: '5-8 years', experienceMin: 5, experienceMax: 8,
      description: 'Senior data scientist', url: 'http://test2.com',
      location: 'India', source: 'naukri' as const, datePosted: new Date(),
      dateCollected: new Date(), status: 'new' as const, matchScore: 0, isActive: true,
    };

    const result = await engine.calculateMatchScore(job, mockProfile);
    expect(result.skillMatch).toBe(0);
    expect(result.roleMatch).toBeLessThan(50);
  });
});
