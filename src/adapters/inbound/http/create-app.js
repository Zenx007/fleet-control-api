import express from 'express';
import { createDocsRoutes } from './docs/docs-routes.js';
import { errorHandler, routeNotFound } from './error-handler.js';
import { createCarRoutes } from './routes/car-routes.js';
import { createCarUsageRoutes } from './routes/car-usage-routes.js';
import { createDriverRoutes } from './routes/driver-routes.js';
import { createHealthRoutes } from './routes/health-routes.js';

export function createApp(useCases) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use(createDocsRoutes());
  app.use('/health', createHealthRoutes(useCases));
  app.use('/cars', createCarRoutes(useCases));
  app.use('/drivers', createDriverRoutes(useCases));
  app.use('/car-usages', createCarUsageRoutes(useCases));

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
