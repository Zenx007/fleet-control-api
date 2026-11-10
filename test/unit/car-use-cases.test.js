import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  CarHasUsagesError,
  CarNotFoundError,
  DuplicateLicensePlateError,
  InvalidLicensePlateError,
} from '../../src/domain/errors.js';
import { createInMemoryUseCases } from './support/in-memory-adapters.js';

const blackFiat = { licensePlate: 'ABC1234', color: 'Black', brand: 'Fiat' };

describe('car use cases', () => {
  let useCases;

  beforeEach(() => {
    useCases = createInMemoryUseCases();
  });

  describe('CreateCar', () => {
    it('creates a car with a normalized license plate', async () => {
      const car = await useCases.createCar.execute({ ...blackFiat, licensePlate: 'abc-1d23' });

      assert.deepEqual(
        { ...car },
        { id: 1, licensePlate: 'ABC1D23', color: 'Black', brand: 'Fiat' },
      );
    });

    it('rejects an invalid license plate', async () => {
      await assert.rejects(
        useCases.createCar.execute({ ...blackFiat, licensePlate: 'AB12' }),
        InvalidLicensePlateError,
      );
    });

    it('rejects a duplicate license plate', async () => {
      await useCases.createCar.execute(blackFiat);

      await assert.rejects(
        useCases.createCar.execute({ ...blackFiat, licensePlate: 'abc-1234' }),
        DuplicateLicensePlateError,
      );
    });
  });

  describe('UpdateCar', () => {
    it('updates every field of an existing car', async () => {
      const { id } = await useCases.createCar.execute(blackFiat);

      const car = await useCases.updateCar.execute(id, {
        licensePlate: 'XYZ9A87',
        color: 'White',
        brand: 'Honda',
      });

      assert.deepEqual({ ...car }, { id, licensePlate: 'XYZ9A87', color: 'White', brand: 'Honda' });
      assert.deepEqual(await useCases.getCar.execute(id), car);
    });

    it('fails when the car does not exist', async () => {
      await assert.rejects(useCases.updateCar.execute(99, blackFiat), CarNotFoundError);
    });

    it('rejects the license plate of another car', async () => {
      await useCases.createCar.execute(blackFiat);
      const { id } = await useCases.createCar.execute({ ...blackFiat, licensePlate: 'BBB2222' });

      await assert.rejects(useCases.updateCar.execute(id, blackFiat), DuplicateLicensePlateError);
    });
  });

  describe('DeleteCar', () => {
    it('deletes an existing car', async () => {
      const { id } = await useCases.createCar.execute(blackFiat);

      await useCases.deleteCar.execute(id);

      await assert.rejects(useCases.getCar.execute(id), CarNotFoundError);
    });

    it('fails when the car does not exist', async () => {
      await assert.rejects(useCases.deleteCar.execute(99), CarNotFoundError);
    });

    it('keeps a car that has usage records', async () => {
      const car = await useCases.createCar.execute(blackFiat);
      const driver = await useCases.createDriver.execute({ name: 'Maria' });
      await useCases.startCarUsage.execute({
        driverId: driver.id,
        carId: car.id,
        startDate: new Date('2026-01-10T08:00:00Z'),
        reason: 'Customer visit',
      });

      await assert.rejects(useCases.deleteCar.execute(car.id), CarHasUsagesError);
    });
  });

  describe('GetCar', () => {
    it('returns the car with the given identifier', async () => {
      const created = await useCases.createCar.execute(blackFiat);

      assert.deepEqual(await useCases.getCar.execute(created.id), created);
    });

    it('fails when the car does not exist', async () => {
      await assert.rejects(useCases.getCar.execute(99), CarNotFoundError);
    });
  });

  describe('ListCars', () => {
    beforeEach(async () => {
      await useCases.createCar.execute({ licensePlate: 'AAA1111', color: 'Black', brand: 'Fiat' });
      await useCases.createCar.execute({ licensePlate: 'BBB2222', color: 'Black', brand: 'Ford' });
      await useCases.createCar.execute({ licensePlate: 'CCC3333', color: 'White', brand: 'Fiat' });
    });

    const plates = async (filters) =>
      (await useCases.listCars.execute(filters)).map((car) => car.licensePlate);

    it('lists every car without filters', async () => {
      assert.deepEqual(await plates({}), ['AAA1111', 'BBB2222', 'CCC3333']);
    });

    it('filters by color and brand ignoring case', async () => {
      assert.deepEqual(await plates({ color: 'black' }), ['AAA1111', 'BBB2222']);
      assert.deepEqual(await plates({ brand: 'FIAT' }), ['AAA1111', 'CCC3333']);
      assert.deepEqual(await plates({ color: 'Black', brand: 'Fiat' }), ['AAA1111']);
      assert.deepEqual(await plates({ color: 'Green' }), []);
    });
  });
});
