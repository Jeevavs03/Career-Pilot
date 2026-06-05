import { DataSource } from 'typeorm';
import config from './index';
import { logger } from '../utils/logger';

let AppDataSource: DataSource | null = null;

export const connectPostgres = async (): Promise<void> => {
  try {
    AppDataSource = new DataSource({
      type: 'postgres',
      host: config.postgres.host,
      port: config.postgres.port,
      username: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
      synchronize: false,
      logging: false,
      entities: [],
    });
    await AppDataSource.initialize();
    logger.info('PostgreSQL (TypeORM) connected');
  } catch (error) {
    logger.warn('PostgreSQL not available (non-critical). MongoDB is primary.');
    AppDataSource = null;
  }
};

export const getDataSource = () => AppDataSource;
