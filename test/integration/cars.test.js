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

describe('cars', () => {
  before(prepareDatabase);
  beforeEach(cleanDatabase);
  after(closeDatabase);

  it('creates a car normalizing the license plate', async () => {
    const response = await api
      .post('/cars')
      .send({ licensePlate: ' abc-1234 ', color: ' Silver ', brand: 'Volkswagen' })
      .expect(201);

    assert.deepEqual(response.body, {
      id: 1,
      licensePlate: 'ABC1234',
      color: 'Silver',
      brand: 'Volkswagen',
    });
    assert.equal(response.headers.location, '/cars/1');
  });

  it('reports every invalid field', async () => {
    const { body } = await api.post('/cars').send({ licensePlate: 'X', brand: 5 }).expect(400);

    assert.deepEqual(
      body.details.map((item) => item.field),
      ['licensePlate', 'color', 'brand'],
    );
  });

  it('rejects a duplicate license plate even with different formatting', async () => {
    await createCar({ licensePlate: 'ABC1234' });

    await api
      .post('/cars')
      .send({ licensePlate: 'abc-1234', color: 'Blue', brand: 'Ford' })
      .expect(409);
  });

  it('updates a car', async () => {
    const car = await createCar();

    const { body } = await api
      .put(`/cars/${car.id}`)
      .send({ licensePlate: 'XYZ9A87', color: 'White', brand: 'Honda' })
      .expect(200);

    assert.deepEqual(body, { id: car.id, licensePlate: 'XYZ9A87', color: 'White', brand: 'Honda' });
  });

  it('rejects updating to the license plate of another car', async () => {
    await createCar({ licensePlate: 'AAA1111' });
    const other = await createCar({ licensePlate: 'BBB2222' });

    await api
      .put(`/cars/${other.id}`)
      .send({ licensePlate: 'AAA1111', color: 'Blue', brand: 'Ford' })
      .expect(409);
  });

  it('gets a car by identifier', async () => {
    const car = await createCar();

    const { body } = await api.get(`/cars/${car.id}`).expect(200);

    assert.deepEqual(body, car);
  });

  it('returns 404 for a missing car', async () => {
    const data = { licensePlate: 'ABC1234', color: 'Blue', brand: 'Ford' };

    await api.get('/cars/999').expect(404);
    await api.put('/cars/999').send(data).expect(404);
    await api.delete('/cars/999').expect(404);
  });

  it('returns 400 for an invalid identifier', async () => {
    await api.get('/cars/abc').expect(400);
    await api.get('/cars/0').expect(400);
    await api.get('/cars/2147483648').expect(400);
  });

  it('deletes a car', async () => {
    const car = await createCar();

    await api.delete(`/cars/${car.id}`).expect(204);
    await api.get(`/cars/${car.id}`).expect(404);
  });

  it('does not delete a car with usage history', async () => {
    const car = await createCar();
    const driver = await createDriver();
    await startCarUsage(driver, car).expect(201);

    await api.delete(`/cars/${car.id}`).expect(409);
  });

  it('lists and filters by color and brand ignoring case', async () => {
    await createCar({ licensePlate: 'AAA1111', color: 'Black', brand: 'Fiat' });
    await createCar({ licensePlate: 'BBB2222', color: 'Black', brand: 'Ford' });
    await createCar({ licensePlate: 'CCC3333', color: 'White', brand: 'Fiat' });

    const plates = async (query) => {
      const { body } = await api.get('/cars').query(query).expect(200);
      return body.map((car) => car.licensePlate);
    };

    assert.deepEqual(await plates({}), ['AAA1111', 'BBB2222', 'CCC3333']);
    assert.deepEqual(await plates({ color: 'black' }), ['AAA1111', 'BBB2222']);
    assert.deepEqual(await plates({ brand: 'FIAT' }), ['AAA1111', 'CCC3333']);
    assert.deepEqual(await plates({ color: 'black', brand: 'fiat' }), ['AAA1111']);
    assert.deepEqual(await plates({ color: 'Green' }), []);
    assert.deepEqual(await plates({ color: '' }), ['AAA1111', 'BBB2222', 'CCC3333']);
  });

  it('handles malformed JSON, null characters and unknown routes', async () => {
    await api
      .post('/cars')
      .set('Content-Type', 'application/json')
      .send('{"licensePlate"')
      .expect(400);
    await api.post('/cars').expect(400);
    await api.get('/cars').query({ color: 'a\u0000b' }).expect(400);
    await api.get('/unknown').expect(404);
  });
});
