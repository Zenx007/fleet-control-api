import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Car } from '../../src/domain/car.js';
import { CarUsage } from '../../src/domain/car-usage.js';
import { Driver } from '../../src/domain/driver.js';
import {
  CarUsageAlreadyFinishedError,
  InvalidLicensePlateError,
  InvalidUsagePeriodError,
} from '../../src/domain/errors.js';

const startDate = new Date('2026-01-10T08:00:00Z');

const createUsage = () =>
  new CarUsage({
    driver: new Driver({ id: 1, name: 'Maria' }),
    car: new Car({ id: 1, licensePlate: 'ABC1234', color: 'Black', brand: 'Fiat' }),
    startDate,
    reason: 'Customer visit',
  });

describe('Car', () => {
  it('normalizes old and Mercosul license plates', () => {
    assert.equal(
      new Car({ licensePlate: ' abc-1234 ', color: 'a', brand: 'b' }).licensePlate,
      'ABC1234',
    );
    assert.equal(
      new Car({ licensePlate: 'abc1d23', color: 'a', brand: 'b' }).licensePlate,
      'ABC1D23',
    );
  });

  it('rejects an invalid license plate', () => {
    assert.throws(
      () => new Car({ licensePlate: 'A-BC1234', color: 'a', brand: 'b' }),
      InvalidLicensePlateError,
    );
  });
});

describe('CarUsage', () => {
  it('starts unfinished', () => {
    assert.equal(createUsage().isFinished, false);
  });

  it('records the end date when finished', () => {
    const usage = createUsage();
    const endDate = new Date('2026-01-10T09:00:00Z');

    usage.finish(endDate);

    assert.equal(usage.endDate, endDate);
    assert.equal(usage.isFinished, true);
  });

  it('rejects an end date that is not later than the start date', () => {
    assert.throws(() => createUsage().finish(startDate), InvalidUsagePeriodError);
    assert.throws(
      () => createUsage().finish(new Date('2026-01-10T07:00:00Z')),
      InvalidUsagePeriodError,
    );
  });

  it('cannot be finished twice', () => {
    const usage = createUsage();
    usage.finish(new Date('2026-01-10T09:00:00Z'));

    assert.throws(
      () => usage.finish(new Date('2026-01-10T10:00:00Z')),
      CarUsageAlreadyFinishedError,
    );
  });
});
