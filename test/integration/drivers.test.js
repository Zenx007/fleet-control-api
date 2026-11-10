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

describe('drivers', () => {
  before(prepareDatabase);
  beforeEach(cleanDatabase);
  after(closeDatabase);

  it('creates a driver', async () => {
    const response = await api.post('/drivers').send({ name: '  Ana Souza ' }).expect(201);

    assert.deepEqual(response.body, { id: 1, name: 'Ana Souza' });
    assert.equal(response.headers.location, '/drivers/1');
  });

  it('rejects a missing, empty or too long name', async () => {
    await api.post('/drivers').send({}).expect(400);
    await api.post('/drivers').send({ name: '   ' }).expect(400);
    await api
      .post('/drivers')
      .send({ name: 'a'.repeat(151) })
      .expect(400);
  });

  it('updates, gets and deletes a driver', async () => {
    const driver = await createDriver();

    const { body } = await api.put(`/drivers/${driver.id}`).send({ name: 'New Name' }).expect(200);
    assert.deepEqual(body, { id: driver.id, name: 'New Name' });

    const found = await api.get(`/drivers/${driver.id}`).expect(200);
    assert.deepEqual(found.body, body);

    await api.delete(`/drivers/${driver.id}`).expect(204);
    await api.get(`/drivers/${driver.id}`).expect(404);
  });

  it('returns 404 for a missing driver', async () => {
    await api.get('/drivers/999').expect(404);
    await api.put('/drivers/999').send({ name: 'Ana' }).expect(404);
    await api.delete('/drivers/999').expect(404);
  });

  it('does not delete a driver with usage history', async () => {
    const driver = await createDriver();
    const car = await createCar();
    await startCarUsage(driver, car).expect(201);

    await api.delete(`/drivers/${driver.id}`).expect(409);
  });

  it('filters by part of the name treating wildcards as text', async () => {
    await createDriver('Maria Silva');
    await createDriver('João Pereira');
    await createDriver('100% Driver');

    const names = async (name) => {
      const { body } = await api
        .get('/drivers')
        .query(name === undefined ? {} : { name })
        .expect(200);
      return body.map((driver) => driver.name);
    };

    assert.deepEqual(await names(), ['100% Driver', 'João Pereira', 'Maria Silva']);
    assert.deepEqual(await names('silv'), ['Maria Silva']);
    assert.deepEqual(await names('%'), ['100% Driver']);
    assert.deepEqual(await names('_'), []);
  });
});
