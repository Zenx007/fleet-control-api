import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  api,
  cleanDatabase,
  closeDatabase,
  createCar,
  createDriver,
  prepareDatabase,
  startCarUsage,
} from './helpers.js';

describe('car usages', () => {
  let driver;
  let car;

  before(prepareDatabase);
  after(closeDatabase);

  beforeEach(async () => {
    await cleanDatabase();
    driver = await createDriver();
    car = await createCar();
  });

  it('starts a usage with its driver and car', async () => {
    const { body } = await startCarUsage(driver, car).expect(201);

    assert.deepEqual(body, {
      id: 1,
      startDate: '2026-01-10T11:00:00.000Z',
      endDate: null,
      reason: 'Customer visit',
      driver,
      car,
    });
  });

  it('validates the start data', async () => {
    const { body } = await api
      .post('/car-usages')
      .send({ driverId: 'a', startDate: '10/01/2026' })
      .expect(400);

    assert.deepEqual(
      body.details.map((item) => item.field),
      ['driverId', 'carId', 'startDate', 'reason'],
    );
    await startCarUsage(driver, car, { startDate: '2026-02-30T10:00:00Z' }).expect(400);
    await startCarUsage(driver, car, { reason: '  ' }).expect(400);
  });

  it('returns 404 for a missing driver or car', async () => {
    const missing = { id: 999 };

    const withoutDriver = await startCarUsage(missing, car).expect(404);
    const withoutCar = await startCarUsage(driver, missing).expect(404);

    assert.match(withoutDriver.body.error, /Driver/);
    assert.match(withoutCar.body.error, /Car/);
  });

  it('prevents a car in use from being used by another driver', async () => {
    const otherDriver = await createDriver('Other');
    await startCarUsage(driver, car).expect(201);

    const { body } = await startCarUsage(otherDriver, car).expect(409);

    assert.match(body.error, /car is already being used/);
  });

  it('prevents a busy driver from using another car', async () => {
    const otherCar = await createCar({ licensePlate: 'XYZ9A87' });
    await startCarUsage(driver, car).expect(201);

    const { body } = await startCarUsage(driver, otherCar).expect(409);

    assert.match(body.error, /driver is already using/);
  });

  it('enforces the rules under concurrent requests', async () => {
    const drivers = await Promise.all(['A', 'B', 'C', 'D', 'E'].map(createDriver));

    const responses = await Promise.all(drivers.map((item) => startCarUsage(item, car)));
    const statuses = responses.map((response) => response.status).sort();

    assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
  });

  it('prevents a new period from overlapping a finished usage', async () => {
    const { body } = await startCarUsage(driver, car, { startDate: '2026-01-10T08:00:00Z' }).expect(
      201,
    );
    await api
      .patch(`/car-usages/${body.id}/finish`)
      .send({ endDate: '2026-01-10T12:00:00Z' })
      .expect(200);

    await startCarUsage(driver, car, { startDate: '2026-01-10T11:00:00Z' }).expect(409);
  });

  it('releases the driver and the car after finishing', async () => {
    const { body } = await startCarUsage(driver, car, { startDate: '2026-01-10T08:00:00Z' }).expect(
      201,
    );
    await api
      .patch(`/car-usages/${body.id}/finish`)
      .send({ endDate: '2026-01-10T12:00:00Z' })
      .expect(200);

    await startCarUsage(driver, car, { startDate: '2026-01-10T12:00:00Z' }).expect(201);
  });

  it('finishes with the given date', async () => {
    const { body: started } = await startCarUsage(driver, car).expect(201);

    const { body } = await api
      .patch(`/car-usages/${started.id}/finish`)
      .send({ endDate: '2026-01-10T18:30:00Z' })
      .expect(200);

    assert.equal(body.endDate, '2026-01-10T18:30:00.000Z');
    assert.deepEqual(body.driver, driver);
    assert.deepEqual(body.car, car);
  });

  it('finishes with the current date when none is given', async () => {
    const { body: started } = await startCarUsage(driver, car).expect(201);
    const before = Date.now();

    const { body } = await api.patch(`/car-usages/${started.id}/finish`).expect(200);

    assert.ok(new Date(body.endDate).getTime() >= before - 1000);
  });

  it('rejects an end date before or equal to the start date', async () => {
    const { body } = await startCarUsage(driver, car, { startDate: '2026-01-10T08:00:00Z' }).expect(
      201,
    );
    const route = `/car-usages/${body.id}/finish`;

    await api.patch(route).send({ endDate: '2026-01-10T07:00:00Z' }).expect(422);
    await api.patch(route).send({ endDate: '2026-01-10T08:00:00Z' }).expect(422);
    await api.patch(route).send({ endDate: 'yesterday' }).expect(400);
  });

  it('does not finish twice or finish a missing usage', async () => {
    const { body } = await startCarUsage(driver, car).expect(201);
    await api.patch(`/car-usages/${body.id}/finish`).expect(200);

    await api.patch(`/car-usages/${body.id}/finish`).expect(409);
    await api.patch('/car-usages/999/finish').expect(404);
  });

  it('allows only one of many concurrent finish requests', async () => {
    const { body } = await startCarUsage(driver, car).expect(201);
    const route = `/car-usages/${body.id}/finish`;

    const responses = await Promise.all([1, 2, 3].map(() => api.patch(route)));
    const statuses = responses.map((response) => response.status).sort();

    assert.deepEqual(statuses, [200, 409, 409]);
  });

  it('lists with the driver name and the car data', async () => {
    const otherDriver = await createDriver('Carlos');
    const otherCar = await createCar({ licensePlate: 'XYZ9A87', color: 'Blue', brand: 'Ford' });
    await startCarUsage(driver, car, { startDate: '2026-01-01T08:00:00Z' }).expect(201);
    await startCarUsage(otherDriver, otherCar, { startDate: '2026-01-02T08:00:00Z' }).expect(201);

    const { body } = await api.get('/car-usages').expect(200);

    assert.equal(body.length, 2);
    assert.deepEqual(body[0].driver, otherDriver);
    assert.deepEqual(body[0].car, otherCar);
    assert.deepEqual(body[1].driver, driver);
    assert.deepEqual(body[1].car, car);
  });
});
