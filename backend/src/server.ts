import 'reflect-metadata';
import app from './app';
import config from './config';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { connectPostgres } from './config/typeorm';
import { startWorkers } from './queues';
import { startScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // Connect databases
    await connectMongoDB();
    await connectRedis().catch(e => logger.warn('Redis not available:', e.message));
    await connectPostgres().catch(e => logger.warn('PostgreSQL not available:', e.message));

    // Start background workers
    try { await startWorkers(); } catch (e) { logger.warn('Workers not started (Redis required)'); }

    // Start scheduler
    startScheduler();

    // Start server
    app.listen(config.port, () => {
      logger.info(`🚀 CareerPilot AI Backend running on port ${config.port}`);
      logger.info(`📡 API: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`🔧 Environment: ${config.env}`);
      logger.info(`🤖 AI Mode: ${config.hardwareMode}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
