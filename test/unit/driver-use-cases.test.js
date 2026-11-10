import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { DriverHasUsagesError, DriverNotFoundError } from '../../src/domain/errors.js';
import { createInMemoryUseCases } from './support/in-memory-adapters.js';

describe('driver use cases', () => {
  let useCases;

  beforeEach(() => {
    useCases = createInMemoryUseCases();
  });

  describe('CreateDriver', () => {
    it('creates a driver with an identifier', async () => {
      const driver = await useCases.createDriver.execute({ name: 'Maria Silva' });

      assert.deepEqual({ ...driver }, { id: 1, name: 'Maria Silva' });
    });
  });

  describe('UpdateDriver', () => {
    it('updates the name of an existing driver', async () => {
      const { id } = await useCases.createDriver.execute({ name: 'Maria' });

      const driver = await useCases.updateDriver.execute(id, { name: 'Maria Silva' });

      assert.deepEqual({ ...driver }, { id, name: 'Maria Silva' });
      assert.deepEqual(await useCases.getDriver.execute(id), driver);
    });

    it('fails when the driver does not exist', async () => {
      await assert.rejects(
        useCases.updateDriver.execute(99, { name: 'Maria' }),
        DriverNotFoundError,
      );
    });
  });

  describe('DeleteDriver', () => {
    it('deletes an existing driver', async () => {
      const { id } = await useCases.createDriver.execute({ name: 'Maria' });

      await useCases.deleteDriver.execute(id);

      await assert.rejects(useCases.getDriver.execute(id), DriverNotFoundError);
    });

    it('fails when the driver does not exist', async () => {
      await assert.rejects(useCases.deleteDriver.execute(99), DriverNotFoundError);
    });

    it('keeps a driver that has usage records', async () => {
      const driver = await useCases.createDriver.execute({ name: 'Maria' });
      const car = await useCases.createCar.execute({
        licensePlate: 'ABC1234',
        color: 'Black',
        brand: 'Fiat',
      });
      await useCases.startCarUsage.execute({
        driverId: driver.id,
        carId: car.id,
        startDate: new Date('2026-01-10T08:00:00Z'),
        reason: 'Customer visit',
      });

      await assert.rejects(useCases.deleteDriver.execute(driver.id), DriverHasUsagesError);
    });
  });

  describe('GetDriver', () => {
    it('returns the driver with the given identifier', async () => {
      const created = await useCases.createDriver.execute({ name: 'Maria' });

      assert.deepEqual(await useCases.getDriver.execute(created.id), created);
    });

    it('fails when the driver does not exist', async () => {
      await assert.rejects(useCases.getDriver.execute(99), DriverNotFoundError);
    });
  });

  describe('ListDrivers', () => {
    beforeEach(async () => {
      await useCases.createDriver.execute({ name: 'Maria Silva' });
      await useCases.createDriver.execute({ name: 'Carlos Souza' });
      await useCases.createDriver.execute({ name: 'Ana Silveira' });
    });

    const names = async (filters) =>
      (await useCases.listDrivers.execute(filters)).map((driver) => driver.name);

    it('lists every driver in alphabetical order', async () => {
      assert.deepEqual(await names({}), ['Ana Silveira', 'Carlos Souza', 'Maria Silva']);
    });

    it('filters by part of the name ignoring case', async () => {
      assert.deepEqual(await names({ name: 'SILV' }), ['Ana Silveira', 'Maria Silva']);
      assert.deepEqual(await names({ name: 'pedro' }), []);
    });
  });
});
