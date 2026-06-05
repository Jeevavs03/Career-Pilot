import cron from 'node-cron';
import config from '../config';
import { User } from '../models/mongoose';
import { autoPilotService } from '../services/autoPilotService';
import { logger } from '../utils/logger';

export const startScheduler = () => {
  // Morning run - 08:00 IST
  cron.schedule(config.scheduler.morning, async () => {
    logger.info('⏰ Morning auto-pilot triggered');
    await runAutoPilot();
  }, { timezone: config.scheduler.timezone });

  // Evening run - 20:00 IST
  cron.schedule(config.scheduler.evening, async () => {
    logger.info('⏰ Evening auto-pilot triggered');
    await runAutoPilot();
  }, { timezone: config.scheduler.timezone });

  logger.info(`Scheduler started: ${config.scheduler.morning} & ${config.scheduler.evening} (${config.scheduler.timezone})`);
};

async function runAutoPilot() {
  try {
    const users = await User.find({});
    for (const user of users) {
      try {
        const result = await autoPilotService.runFullPipeline(user._id.toString());
        logger.info(`[Scheduler] ${user.name}: ${result.searched} found, ${result.applied} applied`);
      } catch (e) {
        logger.error(`[Scheduler] Failed for ${user.email}:`, e);
      }
    }
  } catch (e) {
    logger.error('Scheduler error:', e);
  }
}
