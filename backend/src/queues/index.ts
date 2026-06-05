import { Queue, Worker, Job as BullJob } from 'bullmq';
import config from '../config';
import { logger } from '../utils/logger';
import { jobScraper } from '../scrapers/jobScraper';
import { jobService } from '../services/jobService';
import { matchingEngine } from '../ai/matching';
import { applicationService } from '../services/applicationService';
import { analyticsService } from '../services/analyticsService';
import { reportService } from '../services/reportService';
import { User, Job } from '../models/mongoose';
import { IUserProfile } from '../types';

const connection = { host: config.redis.host, port: config.redis.port, maxRetriesPerRequest: null };

// Queues (lazy initialized)
export let jobCollectionQueue: Queue | null = null;
export let jobMatchingQueue: Queue | null = null;
export let reportQueue: Queue | null = null;

function initQueues() {
  jobCollectionQueue = new Queue('job-collection', { connection });
  jobMatchingQueue = new Queue('job-matching', { connection });
  reportQueue = new Queue('report-generation', { connection });
}

// Workers
export const startWorkers = async () => {
  // Check Redis connectivity before starting workers
  const net = await import('net');
  const isRedisUp = await new Promise<boolean>(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { resolve(false); });
    socket.connect(config.redis.port, config.redis.host);
  });

  if (!isRedisUp) {
    logger.warn('Redis not available — workers skipped. Queues disabled.');
    return;
  }

  try { initQueues(); } catch (e) { logger.warn('Redis unavailable, queues not initialized'); return; }
  // Job Collection Worker
  new Worker('job-collection', async (job: BullJob) => {
    const { urls, userId } = job.data;
    logger.info(`Processing job collection: ${urls.length} URLs`);

    for (const url of urls) {
      try {
        const scraped = await jobScraper.scrapeFromUrl(url);
        if (scraped) {
          await jobService.createJob(scraped).catch(() => {});
        }
      } catch (e) {
        logger.warn(`Failed to scrape ${url}:`, e);
      }
    }

    await jobMatchingQueue!.add('match-jobs', { userId });
  }, { connection, concurrency: 2 });

  // Job Matching Worker
  new Worker('job-matching', async (job: BullJob) => {
    const { userId } = job.data;
    const user = await User.findById(userId);
    if (!user) return;

    const profile = user.profile as unknown as IUserProfile;
    const filteredJobs = await jobService.filterJobs();

    logger.info(`Matching ${filteredJobs.length} filtered jobs`);

    for (const j of filteredJobs) {
      try {
        const jobObj = (j as any).toObject ? (j as any).toObject() : j;
        const match = await matchingEngine.calculateMatchScore(jobObj, profile);
        const id = (j._id || (j as any).id || '').toString();
        await jobService.updateJobStatus(id, match.overallScore >= 75 ? 'matched' : 'filtered', match.overallScore, match);

        if (match.overallScore >= 75) {
          await applicationService.createApplicationPackage(userId, id).catch(() => {});
        }
      } catch (e) {
        logger.warn(`Match failed for job:`, e);
      }
    }

    await analyticsService.recordDaily(userId);
  }, { connection, concurrency: 1 });

  // Report Worker
  new Worker('report-generation', async (job: BullJob) => {
    const { userId } = job.data;
    await reportService.generateDailyReport(userId);
    logger.info('Daily report generated');
  }, { connection, concurrency: 1 });

  logger.info('BullMQ workers started');
};
