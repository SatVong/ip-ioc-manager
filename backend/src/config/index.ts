import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    user: process.env.DB_USER || 'postgres-ip-manager',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ipioc_db',
    password: process.env.DB_PASSWORD || 'vhtuajmsavdshs213fvsdcv',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов за windowMs
    authMax: 10, // максимум 10 попыток входа за windowMs
  },
};