import { Router } from 'express';

export function createHealthRoutes({ checkHealth }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const healthy = await checkHealth.execute();
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable' });
  });

  return router;
}
