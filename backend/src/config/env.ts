import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_crm',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_nexus_crm_enterprise_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_nexus_crm_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'no-reply@nexuscrm.io',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Nexus CRM',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
  ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-mini-realtime-preview',
  AI_DAILY_LIMIT: parseInt(process.env.AI_DAILY_LIMIT || '100', 10)
};
