import request from 'supertest';
import { createApplication } from '../../src/composition-root.js';

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/fleet_test';

const application = createApplication({ databaseUrl });

async function assertDatabaseIsAvailable() {
  try {
    await application.pool.query('SELECT 1');
  } catch (error) {
    await application.close();
    const { host, pathname } = new URL(databaseUrl);
    throw new Error(
      `Integration tests need PostgreSQL at ${host}${pathname}. ` +
        'Start it with "docker compose up -d db" or set TEST_DATABASE_URL.',
      { cause: error },
    );
  }
}

await assertDatabaseIsAvailable();

export const api = request(application.app);

export const prepareDatabase = () => application.migrate();

export const cleanDatabase = () =>
  application.pool.query('TRUNCATE car_usages, cars, drivers RESTART IDENTITY CASCADE');

export const closeDatabase = () => application.close();

export async function createCar(data = {}) {
  const { body } = await api
    .post('/cars')
    .send({ licensePlate: 'ABC1D23', color: 'Black', brand: 'Fiat', ...data })
    .expect(201);
  return body;
}

export async function createDriver(name = 'Maria Silva') {
  const { body } = await api.post('/drivers').send({ name }).expect(201);
  return body;
}

export const startCarUsage = (driver, car, data = {}) =>
  api.post('/car-usages').send({
    driverId: driver.id,
    carId: car.id,
    startDate: '2026-01-10T08:00:00-03:00',
    reason: 'Customer visit',
    ...data,
  });
