import cron from 'node-cron';
import { Store } from '../models/store.model';
import { forecastService } from '../services/forecast.service';
import { logger } from '../config/logger';

// Run at 2 AM IST daily
export const startForecastRefreshJob = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting nightly forecast refresh...');
    try {
      const stores = await Store.find({ isActive: true });
      for (const store of stores) {
        try {
          await forecastService.generateForStore(String(store._id));
          logger.info(`Forecasts refreshed for store: ${store.name}`);
        } catch (err) {
          logger.error({ err }, `Forecast refresh failed for store ${store.name}`);
        }
      }
      logger.info('Nightly forecast refresh complete');
    } catch (err) {
      logger.error({ err }, 'Forecast refresh job failed');
    }
  }, { timezone: 'Asia/Kolkata' });
};
