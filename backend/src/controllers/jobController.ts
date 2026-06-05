import { Request, Response } from 'express';
import { jobService } from '../services/jobService';
import { jobScraper } from '../scrapers/jobScraper';
import { jobCollectionQueue } from '../queues';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class JobController {
  async getJobs(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await jobService.getJobs(undefined, +page, +limit);
      sendSuccess(res, result);
    } catch (e: any) { sendError(res, e); }
  }

  async getJobById(req: Request, res: Response) {
    try {
      const job = await jobService.getJobById(req.params.id);
      sendSuccess(res, job);
    } catch (e: any) { sendError(res, e); }
  }

  async addJob(req: AuthRequest, res: Response) {
    try {
      const job = await jobService.createJob(req.body);
      sendSuccess(res, job, 'Job added', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async addJobFromUrl(req: AuthRequest, res: Response) {
    try {
      const { url } = req.body;
      const scraped = await jobScraper.scrapeFromUrl(url);
      if (!scraped) return sendError(res, new Error('Could not scrape job from URL'), 400);
      const job = await jobService.createJob(scraped);
      sendSuccess(res, job, 'Job scraped and added', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async bulkScrape(req: AuthRequest, res: Response) {
    try {
      const { urls } = req.body;
      if (!jobCollectionQueue) return sendError(res, new Error('Queue unavailable (Redis not connected)'), 503);
      await jobCollectionQueue.add('bulk-scrape', { urls, userId: req.userId });
      sendSuccess(res, { queued: urls.length }, 'Scraping queued');
    } catch (e: any) { sendError(res, e); }
  }

  async getMatchedJobs(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, minScore = 75 } = req.query;
      const jobs = await jobService.getMatchedJobs(+minScore, +page, +limit);
      sendSuccess(res, jobs);
    } catch (e: any) { sendError(res, e); }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await jobService.getJobStats();
      sendSuccess(res, stats);
    } catch (e: any) { sendError(res, e); }
  }

  async searchJobs(req: AuthRequest, res: Response) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const jobs = await jobService.searchJobs(q as string, +page, +limit);
      sendSuccess(res, jobs);
    } catch (e: any) { sendError(res, e); }
  }

  async deleteJob(req: Request, res: Response) {
    try {
      await jobService.deleteJob(req.params.id);
      sendSuccess(res, null, 'Job deleted');
    } catch (e: any) { sendError(res, e); }
  }
}

export const jobController = new JobController();
