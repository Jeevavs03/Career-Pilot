import { BaseRepository } from './BaseRepository';
import { Job, IJobDocument } from '../models/mongoose';

export class JobRepository extends BaseRepository<IJobDocument> {
  constructor() {
    super(Job);
  }

  async findByUrl(url: string) {
    return this.findOne({ url });
  }

  async findMatched(minScore: number, skip = 0, limit = 20) {
    return this.find({ matchScore: { $gte: minScore }, isActive: true }, { sort: { matchScore: -1 }, skip, limit });
  }

  async findActive(skip = 0, limit = 20) {
    return this.find({ isActive: true }, { sort: { dateCollected: -1 }, skip, limit });
  }

  async textSearch(query: string, limit = 20) {
    return Job.find({ $text: { $search: query }, isActive: true }).limit(limit);
  }
}

export const jobRepository = new JobRepository();
