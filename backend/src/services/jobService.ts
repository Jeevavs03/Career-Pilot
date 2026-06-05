import { Job } from '../models/mongoose';
import { IJob, IFilterSettings } from '../types';
import { AppError } from '../utils/response';
import { logger } from '../utils/logger';

const DEFAULT_FILTERS: IFilterSettings = {
  minSalary: 7,
  maxExperience: 3,
  locations: ['India'],
  excludeTitles: ['Lead', 'Principal', 'Architect', 'Manager', 'Staff Engineer', 'Director', 'VP'],
  minMatchScore: 75,
};

export class JobService {
  async createJob(jobData: Partial<IJob>) {
    const existing = await Job.findOne({ url: jobData.url });
    if (existing) throw new AppError(409, 'Job already exists');
    return Job.create(jobData);
  }

  async bulkCreateJobs(jobs: Partial<IJob>[]): Promise<{ created: number; duplicates: number }> {
    let created = 0, duplicates = 0;
    for (const job of jobs) {
      try {
        await Job.create(job);
        created++;
      } catch (e: any) {
        if (e.code === 11000) duplicates++;
        else logger.warn('Job insert failed:', e.message);
      }
    }
    return { created, duplicates };
  }

  async getJobs(filters?: Partial<IFilterSettings>, page = 1, limit = 20) {
    const query: any = { isActive: true };
    const f = { ...DEFAULT_FILTERS, ...filters };

    if (f.locations.length > 0) {
      query.location = { $regex: f.locations.join('|'), $options: 'i' };
    }

    const jobs = await Job.find(query)
      .sort({ matchScore: -1, dateCollected: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(query);
    return { jobs, total, page, pages: Math.ceil(total / limit) };
  }

  async getJobById(id: string) {
    const job = await Job.findById(id);
    if (!job) throw new AppError(404, 'Job not found');
    return job;
  }

  async filterJobs(filters?: Partial<IFilterSettings>) {
    const f = { ...DEFAULT_FILTERS, ...filters };
    const allJobs = await Job.find({ isActive: true, status: 'new' });

    return allJobs.filter(job => {
      // Exclude titles
      const titleLower = job.title.toLowerCase();
      if (f.excludeTitles.some(t => titleLower.includes(t.toLowerCase()))) return false;

      // Experience filter
      if (job.experienceMin && job.experienceMin > f.maxExperience) return false;

      // Salary filter (in LPA)
      if (job.salaryMin && job.salaryMin < f.minSalary) return false;

      // Location filter
      if (f.locations.length > 0) {
        const locMatch = f.locations.some(l => job.location.toLowerCase().includes(l.toLowerCase()));
        if (!locMatch) return false;
      }

      return true;
    });
  }

  async updateJobStatus(id: string, status: IJob['status'], matchScore?: number, matchDetails?: any) {
    return Job.findByIdAndUpdate(id, { status, matchScore, matchDetails }, { new: true });
  }

  async getMatchedJobs(minScore = 75, page = 1, limit = 20) {
    return Job.find({ matchScore: { $gte: minScore }, isActive: true })
      .sort({ matchScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async getJobStats() {
    const [total, matched, applied, interview, offer] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({ status: 'matched' }),
      Job.countDocuments({ status: 'applied' }),
      Job.countDocuments({ status: 'interview' }),
      Job.countDocuments({ status: 'offer' }),
    ]);
    return { total, matched, applied, interview, offer };
  }

  async searchJobs(query: string, page = 1, limit = 20) {
    return Job.find({ $text: { $search: query }, isActive: true })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async deleteJob(id: string) {
    return Job.findByIdAndUpdate(id, { isActive: false });
  }
}

export const jobService = new JobService();
