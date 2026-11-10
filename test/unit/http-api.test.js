import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../../src/adapters/inbound/http/create-app.js';
import { createInMemoryUseCases } from './support/in-memory-adapters.js';

const blackFiat = { licensePlate: 'abc-1d23', color: 'Black', brand: 'Fiat' };

describe('HTTP API', () => {
  let api;

  beforeEach(() => {
    api = request(createApp(createInMemoryUseCases()));
  });

  describe('cars', () => {
    it('creates a car and points to its location', async () => {
      const response = await api.post('/cars').send(blackFiat).expect(201);

      assert.deepEqual(response.body, {
        id: 1,
        licensePlate: 'ABC1D23',
        color: 'Black',
        brand: 'Fiat',
      });
      assert.equal(response.headers.location, '/cars/1');
    });

    it('reports every invalid field', async () => {
      const { body } = await api.post('/cars').send({ licensePlate: 'X', brand: 5 }).expect(400);

      assert.equal(body.error, 'Invalid data.');
      assert.deepEqual(body.details, [
        { field: 'licensePlate', message: 'Must follow the format AAA-1234 or AAA1A23.' },
        { field: 'color', message: 'Required field.' },
        { field: 'brand', message: 'Must be a string.' },
      ]);
    });

    it('answers 409 for a duplicate license plate', async () => {
      await api.post('/cars').send(blackFiat).expect(201);

      const { body } = await api.post('/cars').send(blackFiat).expect(409);

      assert.equal(body.error, 'A car with this license plate already exists.');
    });

    it('gets, updates, lists with filters and deletes a car', async () => {
      await api.post('/cars').send(blackFiat).expect(201);
      const update = { licensePlate: 'ABC1D23', color: 'Red', brand: 'Fiat' };

      await api.put('/cars/1').send(update).expect(200);
      const { body: car } = await api.get('/cars/1').expect(200);
      const { body: red } = await api
        .get('/cars')
        .query({ color: 'red', brand: 'FIAT' })
        .expect(200);
      const { body: blue } = await api.get('/cars').query({ color: 'blue' }).expect(200);
      await api.delete('/cars/1').expect(204);

      assert.equal(car.color, 'Red');
      assert.deepEqual(red, [car]);
      assert.deepEqual(blue, []);
      await api.get('/cars/1').expect(404);
    });

    it('answers 404 for a missing car', async () => {
      const { body } = await api.get('/cars/99').expect(404);

      assert.equal(body.error, 'Car not found.');
      await api.put('/cars/99').send(blackFiat).expect(404);
      await api.delete('/cars/99').expect(404);
    });

    it('answers 400 for an invalid identifier or a repeated filter', async () => {
      await api.get('/cars/abc').expect(400);
      await api.get('/cars/0').expect(400);
      await api.get('/cars/2147483648').expect(400);
      await api.get('/cars?color=a&color=b').expect(400);
    });
  });

  describe('drivers', () => {
    it('creates, gets, updates, lists by name and deletes a driver', async () => {
      const created = await api.post('/drivers').send({ name: ' Maria Silva ' }).expect(201);
      await api.put('/drivers/1').send({ name: 'Maria Souza' }).expect(200);
      const { body: driver } = await api.get('/drivers/1').expect(200);
      const { body: found } = await api.get('/drivers').query({ name: 'souz' }).expect(200);
      await api.delete('/drivers/1').expect(204);

      assert.equal(created.headers.location, '/drivers/1');
      assert.deepEqual(driver, { id: 1, name: 'Maria Souza' });
      assert.deepEqual(found, [driver]);
      await api.get('/drivers/1').expect(404);
    });

    it('rejects a missing or empty name', async () => {
      await api.post('/drivers').send({}).expect(400);
      await api.post('/drivers').send({ name: '   ' }).expect(400);
    });
  });

  describe('car usages', () => {
    beforeEach(async () => {
      await api.post('/cars').send(blackFiat).expect(201);
      await api.post('/drivers').send({ name: 'Maria' }).expect(201);
      await api.post('/drivers').send({ name: 'Carlos' }).expect(201);
    });

    const startUsage = (driverId, startDate = '2026-01-10T08:00:00-03:00') =>
      api.post('/car-usages').send({ driverId, carId: 1, startDate, reason: 'Customer visit' });

    it('starts a usage returning the driver and the car', async () => {
      const { body } = await startUsage(2).expect(201);

      assert.deepEqual(body, {
        id: 4,
        startDate: '2026-01-10T11:00:00.000Z',
        endDate: null,
        reason: 'Customer visit',
        driver: { id: 2, name: 'Maria' },
        car: { id: 1, licensePlate: 'ABC1D23', color: 'Black', brand: 'Fiat' },
      });
    });

    it('answers 409 when the car is already in use', async () => {
      await startUsage(2).expect(201);

      const { body } = await startUsage(3, '2026-01-10T09:00:00-03:00').expect(409);

      assert.equal(body.error, 'The car is already being used by a driver during this period.');
    });

    it('answers 404 for a missing driver and 400 for invalid data', async () => {
      await startUsage(99).expect(404);

      const { body } = await api.post('/car-usages').send({ startDate: '10/01/2026' }).expect(400);

      assert.deepEqual(
        body.details.map((item) => item.field),
        ['driverId', 'carId', 'startDate', 'reason'],
      );
    });

    it('finishes a usage and lists it', async () => {
      await startUsage(2).expect(201);

      const { body: finished } = await api
        .patch('/car-usages/4/finish')
        .send({ endDate: '2026-01-10T18:00:00-03:00' })
        .expect(200);
      const { body: list } = await api.get('/car-usages').expect(200);

      assert.equal(finished.endDate, '2026-01-10T21:00:00.000Z');
      assert.deepEqual(list, [finished]);
    });

    it('answers 422 for an invalid period, 409 when finished twice and 404 when missing', async () => {
      await startUsage(2).expect(201);

      await api.patch('/car-usages/4/finish').send({ endDate: '2026-01-10T10:00:00Z' }).expect(422);
      await api.patch('/car-usages/4/finish').expect(200);
      await api.patch('/car-usages/4/finish').expect(409);
      await api.patch('/car-usages/99/finish').expect(404);
    });
  });

  describe('general behavior', () => {
    it('reports the service health', async () => {
      const healthy = await api.get('/health').expect(200);
      const unhealthy = await request(createApp(createInMemoryUseCases({ healthy: false })))
        .get('/health')
        .expect(503);

      assert.deepEqual(healthy.body, { status: 'ok' });
      assert.deepEqual(unhealthy.body, { status: 'unavailable' });
    });

    it('answers 400 for malformed JSON and 404 for unknown routes', async () => {
      const malformed = await api
        .post('/cars')
        .set('Content-Type', 'application/json')
        .send('{"licensePlate"')
        .expect(400);
      const unknown = await api.get('/unknown').expect(404);

      assert.equal(malformed.body.error, 'The request body is not valid JSON.');
      assert.equal(unknown.body.error, 'Route not found.');
    });
  });
});
