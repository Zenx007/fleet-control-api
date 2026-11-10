import { Router } from 'express';
import { presentCar } from '../presenters.js';
import { carFiltersSchema, carSchema } from '../schemas/car-schemas.js';
import { getId } from '../schemas/common-schemas.js';

export function createCarRoutes({ createCar, updateCar, deleteCar, getCar, listCars }) {
  const router = Router();

  router.post('/', async (req, res) => {
    const car = await createCar.execute(carSchema.parse(req.body ?? {}));
    res.status(201).location(`/cars/${car.id}`).json(presentCar(car));
  });

  router.get('/', async (req, res) => {
    const cars = await listCars.execute(carFiltersSchema.parse(req.query));
    res.json(cars.map(presentCar));
  });

  router.get('/:id', async (req, res) => {
    res.json(presentCar(await getCar.execute(getId(req))));
  });

  router.put('/:id', async (req, res) => {
    const id = getId(req);
    res.json(presentCar(await updateCar.execute(id, carSchema.parse(req.body ?? {}))));
  });

  router.delete('/:id', async (req, res) => {
    await deleteCar.execute(getId(req));
    res.status(204).end();
  });

  return router;
}
