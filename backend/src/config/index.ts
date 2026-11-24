import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'ws_access_secret_development_key_default_123!',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'ws_refresh_secret_development_key_default_456!',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  analyticsService: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.ANALYTICS_SERVICE_API_KEY || 'ws_internal_service_key_998877',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  }
};
