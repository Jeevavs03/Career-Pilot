import { Application, Job, Resume, CoverLetter } from '../models/mongoose';
import { matchingEngine, coverLetterGenerator, questionAnswerer, resumeOptimizer } from '../ai';
import { IUserProfile } from '../types';
import { AppError } from '../utils/response';
import { User } from '../models/mongoose';

export class ApplicationService {
  async createApplicationPackage(userId: string, jobId: string) {
    const [job, user] = await Promise.all([Job.findById(jobId), User.findById(userId)]);
    if (!job) throw new AppError(404, 'Job not found');
    if (!user) throw new AppError(404, 'User not found');

    const profile = user.profile as unknown as IUserProfile;

    // Calculate match
    const jobObj = job.toObject() as any;
    const matchDetails = await matchingEngine.calculateMatchScore(jobObj, profile);

    // Generate cover letter
    const coverLetterContent = await coverLetterGenerator.generate(jobObj, profile);
    const coverLetter = await CoverLetter.create({
      userId, jobId, content: coverLetterContent, company: job.company, role: job.title,
    });

    // Generate answers
    const answers = await questionAnswerer.generateAnswers(jobObj, profile);

    // Create application
    const application = await Application.create({
      userId, jobId, status: 'ready', matchScore: matchDetails.overallScore,
      coverletterId: coverLetter._id.toString(), answers,
    });

    // Update job status
    await Job.findByIdAndUpdate(jobId, { status: 'matched', matchScore: matchDetails.overallScore, matchDetails });

    return { application, coverLetter, matchDetails, answers };
  }

  async getApplications(userId: string, status?: string, page = 1, limit = 20) {
    const query: any = { userId };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .sort({ matchScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Application.countDocuments(query);
    return { applications, total, page, pages: Math.ceil(total / limit) };
  }

  async getApplicationById(id: string) {
    const app = await Application.findById(id);
    if (!app) throw new AppError(404, 'Application not found');

    const job = await Job.findById(app.jobId);
    const coverLetter = app.coverletterId ? await CoverLetter.findById(app.coverletterId) : null;

    return { application: app, job, coverLetter };
  }

  async approveApplication(id: string) {
    return Application.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  }

  async rejectApplication(id: string) {
    return Application.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  }

  async updateStatus(id: string, status: string) {
    return Application.findByIdAndUpdate(id, { status }, { new: true });
  }

  async getStats(userId: string) {
    const [queued, ready, approved, interview, offer] = await Promise.all([
      Application.countDocuments({ userId, status: 'queued' }),
      Application.countDocuments({ userId, status: 'ready' }),
      Application.countDocuments({ userId, status: 'approved' }),
      Application.countDocuments({ userId, status: 'interview' }),
      Application.countDocuments({ userId, status: 'offer' }),
    ]);
    return { queued, ready, approved, interview, offer, total: queued + ready + approved + interview + offer };
  }
}

export const applicationService = new ApplicationService();
