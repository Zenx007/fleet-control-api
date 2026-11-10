import { Router } from 'express';
import { presentCarUsage } from '../presenters.js';
import { finishCarUsageSchema, startCarUsageSchema } from '../schemas/car-usage-schemas.js';
import { getId } from '../schemas/common-schemas.js';

export function createCarUsageRoutes({ startCarUsage, finishCarUsage, listCarUsages }) {
  const router = Router();

  router.post('/', async (req, res) => {
    const carUsage = await startCarUsage.execute(startCarUsageSchema.parse(req.body ?? {}));
    res.status(201).json(presentCarUsage(carUsage));
  });

  router.get('/', async (req, res) => {
    const carUsages = await listCarUsages.execute();
    res.json(carUsages.map(presentCarUsage));
  });

  router.patch('/:id/finish', async (req, res) => {
    const id = getId(req);
    const carUsage = await finishCarUsage.execute(id, finishCarUsageSchema.parse(req.body ?? {}));
    res.json(presentCarUsage(carUsage));
  });

  return router;
}
