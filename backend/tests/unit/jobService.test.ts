import { jobService } from '../../src/services/jobService';
import { Job } from '../../src/models/mongoose';

jest.mock('../../src/models/mongoose', () => ({
  Job: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

describe('JobService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createJob', () => {
    it('should reject duplicate URLs', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue({ url: 'http://test.com/job' });
      await expect(jobService.createJob({ url: 'http://test.com/job' } as any))
        .rejects.toThrow('Job already exists');
    });

    it('should create a new job', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue(null);
      const mockJob = { title: 'React Dev', url: 'http://new.com/job' };
      (Job.create as jest.Mock).mockResolvedValue(mockJob);
      const result = await jobService.createJob(mockJob as any);
      expect(result.title).toBe('React Dev');
    });
  });

  describe('getJobStats', () => {
    it('should return job counts', async () => {
      (Job.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      const stats = await jobService.getJobStats();
      expect(stats.total).toBe(100);
      expect(stats.matched).toBe(50);
    });
  });
});
