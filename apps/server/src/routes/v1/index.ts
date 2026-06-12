import { Router } from 'express';
import { authRouter } from './auth.routes';
import { storeRouter } from './store.routes';
import { productRouter } from './product.routes';
import { saleRouter } from './sale.routes';
import { forecastRouter } from './forecast.routes';
import { restockRouter } from './restock.routes';
import { notificationRouter } from './notification.routes';
import { subscriptionRouter } from './subscription.routes';
import { reportRouter } from './report.routes';
import { insightsRouter } from './insights.routes';
import { assistantRouter } from './assistant.routes';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/stores', storeRouter);
v1Router.use('/products', productRouter);
v1Router.use('/sales', saleRouter);
v1Router.use('/forecasts', forecastRouter);
v1Router.use('/restock', restockRouter);
v1Router.use('/notifications', notificationRouter);
v1Router.use('/subscriptions', subscriptionRouter);
v1Router.use('/reports', reportRouter);
v1Router.use('/insights', insightsRouter);
v1Router.use('/assistant', assistantRouter);
