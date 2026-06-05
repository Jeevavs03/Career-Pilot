import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/careerpilot',
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'careerpilot',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'careerpilot-local-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'careerpilot-local-refresh',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
    fallbackModel: process.env.OLLAMA_FALLBACK_MODEL || 'mistral',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  hardwareMode: (process.env.HARDWARE_MODE || 'medium') as 'low' | 'medium' | 'high',

  scheduler: {
    morning: process.env.SCHEDULER_MORNING || '0 8 * * *',
    evening: process.env.SCHEDULER_EVENING || '0 20 * * *',
    timezone: process.env.SCHEDULER_TZ || 'Asia/Kolkata',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  reportsDir: process.env.REPORTS_DIR || path.resolve(__dirname, '../../reports'),

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  chromadb: {
    url: process.env.CHROMADB_URL || 'http://localhost:8000',
  },
};

export const getModelForHardware = () => {
  switch (config.hardwareMode) {
    case 'low': return { chat: 'qwen2:1.5b', embed: 'nomic-embed-text' };
    case 'medium': return { chat: config.ollama.model, embed: config.ollama.embedModel };
    case 'high': return { chat: 'qwen2:14b', embed: 'nomic-embed-text' };
    default: return { chat: config.ollama.model, embed: config.ollama.embedModel };
  }
};

export default config;
