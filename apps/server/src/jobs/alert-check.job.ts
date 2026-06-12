import cron from 'node-cron';
import { Store } from '../models/store.model';
import { Product } from '../models/product.model';
import { notificationService } from '../services/notification.service';
import { logger } from '../config/logger';

// Run every hour
export const startAlertCheckJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running low-stock alert check...');
    try {
      const stores = await Store.find({ isActive: true });

      for (const store of stores) {
        const lowStockProducts = await Product.find({
          storeId: store._id,
          isActive: true,
          $expr: { $lte: ['$currentStock', '$reorderLevel'] },
        });

        
        for (const product of lowStockProducts) {
          // Avoid duplicate notifications - check if one was created in last 24h
          const { Notification } = await import('../models/notification.model');
          const recentNotif = await Notification.findOne({
            storeId: store._id,
            type: 'low_stock',
            'data.productId': product._id,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          });

          if (!recentNotif) {
            await notificationService.create(
              store.ownerId.toString(),
              String(store._id),
              'low_stock',
              `Low Stock: ${product.name}`,
              `${product.name} (${product.sku}) has only ${product.currentStock} ${product.unit}(s) left. Reorder level is ${product.reorderLevel}.`,
              { productId: product._id, currentStock: product.currentStock }
            );
          }
        }
      }
      logger.info('Low-stock alert check complete');
    } catch (err) {
      logger.error({ err }, 'Alert check job failed');
    }
  });
};
