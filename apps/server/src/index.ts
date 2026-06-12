import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { startForecastRefreshJob } from './jobs/forecast-refresh.job';
import { startAlertCheckJob } from './jobs/alert-check.job';

const start = async () => {
  await connectDB();

  startForecastRefreshJob();
  startAlertCheckJob();
  logger.info('Background jobs scheduled (forecast refresh, low-stock alerts)');

  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      logger.info('Server closed');
      process.exit(0);
    });
    // Force-exit if connections refuse to drain
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
