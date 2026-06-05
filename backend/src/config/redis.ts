import config from './index';
import { logger } from '../utils/logger';

// Redis connection is managed by BullMQ directly via connection config object.
// This module provides the config for any direct Redis usage if needed.

export const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
};

export const connectRedis = async (): Promise<void> => {
  // BullMQ handles its own Redis connections.
  // This just validates connectivity.
  const net = await import('net');
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on('connect', () => { socket.destroy(); logger.info('Redis connected'); resolve(); });
    socket.on('timeout', () => { socket.destroy(); reject(new Error('Redis timeout')); });
    socket.on('error', (err) => { reject(err); });
    socket.connect(config.redis.port, config.redis.host);
  });
};
