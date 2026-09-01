import dns from 'dns';

// Local networks often can't resolve MongoDB Atlas SRV records; Google's
// resolvers work around that in dev. Never override DNS on a hosting platform
// (Render/Railway) — it relies on its own resolver for internal traffic.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { startForecastRefreshJob } from './jobs/forecast-refresh.job';
import { startAlertCheckJob } from './jobs/alert-check.job';

const start = async () => {
  // Bind the port before the DB handshake. Render health-checks the port and
  // fails the deploy if nothing is listening while Mongo is still connecting.
  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  await connectDB();

  startForecastRefreshJob();
  startAlertCheckJob();
  logger.info('Background jobs scheduled (forecast refresh, low-stock alerts)');

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
