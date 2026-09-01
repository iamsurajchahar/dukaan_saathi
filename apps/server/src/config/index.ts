import dotenv from 'dotenv';
import path from 'path';

// Load apps/server/.env first (works from both src/ and dist/), then fall back to repo root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksense',
  },

  // Cost factor for password hashing. 10 is the OWASP floor and hashes in
  // roughly a quarter the time of 12, which dominates signup on a small
  // instance. Raise it here if the host has CPU to spare; bcrypt records the
  // cost inside each hash, so existing passwords keep verifying either way.
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@stocksense.app',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
};

// Never run production with fallback dev secrets
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production'
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in production');
  }
}
