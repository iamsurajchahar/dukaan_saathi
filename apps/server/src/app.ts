import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rate-limit.middleware';
import { v1Router } from './routes/v1';

const app = express();

// Behind a reverse proxy (nginx/render/railway) in production — needed for
// correct client IPs in rate limiting and logs
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
app.use(pinoHttp({ logger }));

// Rate limiting
app.use('/api/', generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'DukaanSathi API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', v1Router);

// JSON 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export default app;
