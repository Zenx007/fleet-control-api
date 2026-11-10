import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  CarNotFoundError,
  CarUnavailableError,
  CarUsageAlreadyFinishedError,
  CarUsageNotFoundError,
  DriverNotFoundError,
  DriverUnavailableError,
  InvalidUsagePeriodError,
} from '../../src/domain/errors.js';
import { createInMemoryUseCases } from './support/in-memory-adapters.js';

const at = (time) => new Date(`2026-01-10T${time}:00Z`);

describe('car usage use cases', () => {
  let useCases;
  let maria;
  let carlos;
  let fiat;
  let ford;

  const start = (driver, car, startTime = '08:00', reason = 'Customer visit') =>
    useCases.startCarUsage.execute({
      driverId: driver.id,
      carId: car.id,
      startDate: at(startTime),
      reason,
    });

  const finish = (usage, endTime) =>
    useCases.finishCarUsage.execute(usage.id, { endDate: endTime && at(endTime) });

  beforeEach(async () => {
    useCases = createInMemoryUseCases({ now: at('20:00') });
    maria = await useCases.createDriver.execute({ name: 'Maria' });
    carlos = await useCases.createDriver.execute({ name: 'Carlos' });
    fiat = await useCases.createCar.execute({
      licensePlate: 'ABC1234',
      color: 'Black',
      brand: 'Fiat',
    });
    ford = await useCases.createCar.execute({
      licensePlate: 'XYZ9A87',
      color: 'White',
      brand: 'Ford',
    });
  });

  describe('StartCarUsage', () => {
    it('starts an open usage with the driver, the car and the reason', async () => {
      const usage = await start(maria, fiat);

      assert.deepEqual(usage.driver, maria);
      assert.deepEqual(usage.car, fiat);
      assert.deepEqual(usage.startDate, at('08:00'));
      assert.equal(usage.endDate, null);
      assert.equal(usage.reason, 'Customer visit');
    });

    it('fails when the driver does not exist', async () => {
      await assert.rejects(start({ id: 99 }, fiat), DriverNotFoundError);
    });

    it('fails when the car does not exist', async () => {
      await assert.rejects(start(maria, { id: 99 }), CarNotFoundError);
    });

    it('does not let two drivers use the same car at the same time', async () => {
      await start(maria, fiat);

      await assert.rejects(start(carlos, fiat, '09:00'), CarUnavailableError);
    });

    it('does not let a driver use two cars at the same time', async () => {
      await start(maria, fiat);

      await assert.rejects(start(maria, ford, '09:00'), DriverUnavailableError);
    });

    it('rejects a period that overlaps a finished usage', async () => {
      await finish(await start(maria, fiat, '08:00'), '12:00');

      await assert.rejects(start(carlos, fiat, '11:00'), CarUnavailableError);
    });

    it('releases the car and the driver after the usage is finished', async () => {
      await finish(await start(maria, fiat, '08:00'), '12:00');

      const usage = await start(maria, fiat, '12:00');

      assert.deepEqual(usage.startDate, at('12:00'));
    });
  });

  describe('FinishCarUsage', () => {
    it('records the given end date', async () => {
      const usage = await finish(await start(maria, fiat), '18:30');

      assert.deepEqual(usage.endDate, at('18:30'));
    });

    it('uses the current time when no end date is given', async () => {
      const usage = await finish(await start(maria, fiat));

      assert.deepEqual(usage.endDate, useCases.now);
    });

    it('fails when the usage does not exist', async () => {
      await assert.rejects(finish({ id: 99 }, '18:00'), CarUsageNotFoundError);
    });

    it('cannot finish the same usage twice', async () => {
      const usage = await start(maria, fiat);
      await finish(usage, '18:00');

      await assert.rejects(finish(usage, '19:00'), CarUsageAlreadyFinishedError);
    });

    it('rejects an end date that is not later than the start date', async () => {
      const usage = await start(maria, fiat, '08:00');

      await assert.rejects(finish(usage, '08:00'), InvalidUsagePeriodError);
      await assert.rejects(finish(usage, '07:00'), InvalidUsagePeriodError);
    });
  });

  describe('ListCarUsages', () => {
    it('lists usages from the most recent with the driver and the car', async () => {
      await finish(await start(maria, fiat, '08:00'), '10:00');
      await start(carlos, ford, '11:00');

      const usages = await useCases.listCarUsages.execute();

      assert.deepEqual(
        usages.map((usage) => [usage.driver.name, usage.car.licensePlate, usage.reason]),
        [
          ['Carlos', 'XYZ9A87', 'Customer visit'],
          ['Maria', 'ABC1234', 'Customer visit'],
        ],
      );
    });
  });
});
