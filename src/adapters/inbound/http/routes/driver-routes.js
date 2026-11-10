import { Router } from 'express';
import { presentDriver } from '../presenters.js';
import { getId } from '../schemas/common-schemas.js';
import { driverFiltersSchema, driverSchema } from '../schemas/driver-schemas.js';

export function createDriverRoutes({
  createDriver,
  updateDriver,
  deleteDriver,
  getDriver,
  listDrivers,
}) {
  const router = Router();

  router.post('/', async (req, res) => {
    const driver = await createDriver.execute(driverSchema.parse(req.body ?? {}));
    res.status(201).location(`/drivers/${driver.id}`).json(presentDriver(driver));
  });

  router.get('/', async (req, res) => {
    const drivers = await listDrivers.execute(driverFiltersSchema.parse(req.query));
    res.json(drivers.map(presentDriver));
  });

  router.get('/:id', async (req, res) => {
    res.json(presentDriver(await getDriver.execute(getId(req))));
  });

  router.put('/:id', async (req, res) => {
    const id = getId(req);
    res.json(presentDriver(await updateDriver.execute(id, driverSchema.parse(req.body ?? {}))));
  });

  router.delete('/:id', async (req, res) => {
    await deleteDriver.execute(getId(req));
    res.status(204).end();
  });

  return router;
}
