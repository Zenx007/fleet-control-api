import { CarRepository } from '../../../src/application/ports/car-repository.js';
import { CarUsageRepository } from '../../../src/application/ports/car-usage-repository.js';
import { Clock } from '../../../src/application/ports/clock.js';
import { DriverRepository } from '../../../src/application/ports/driver-repository.js';
import { HealthIndicator } from '../../../src/application/ports/health-indicator.js';
import { createUseCases } from '../../../src/application/create-use-cases.js';
import { Car } from '../../../src/domain/car.js';
import { CarUsage } from '../../../src/domain/car-usage.js';
import { Driver } from '../../../src/domain/driver.js';
import {
  CarHasUsagesError,
  CarUnavailableError,
  CarUsageAlreadyFinishedError,
  DriverHasUsagesError,
  DriverUnavailableError,
  DuplicateLicensePlateError,
} from '../../../src/domain/errors.js';

const sameText = (left, right) => left.toLowerCase() === right.toLowerCase();

const periodsOverlap = (first, second) =>
  first.startDate < (second.endDate ?? Infinity) && second.startDate < (first.endDate ?? Infinity);

const copyCar = (car) => new Car({ ...car });
const copyDriver = (driver) => new Driver({ ...driver });
const copyCarUsage = (usage) =>
  new CarUsage({ ...usage, car: copyCar(usage.car), driver: copyDriver(usage.driver) });

class InMemoryStore {
  constructor() {
    this.cars = new Map();
    this.drivers = new Map();
    this.carUsages = new Map();
    this.lastId = 0;
  }

  nextId() {
    this.lastId += 1;
    return this.lastId;
  }

  usagesOf(field, id) {
    return [...this.carUsages.values()].filter((usage) => usage[field].id === id);
  }
}

export class InMemoryCarRepository extends CarRepository {
  constructor(store) {
    super();
    this.store = store;
  }

  #assertUniqueLicensePlate({ id, licensePlate }) {
    const duplicate = [...this.store.cars.values()].some(
      (car) => car.licensePlate === licensePlate && car.id !== id,
    );

    if (duplicate) {
      throw new DuplicateLicensePlateError();
    }
  }

  async create(car) {
    this.#assertUniqueLicensePlate(car);
    const created = new Car({ ...car, id: this.store.nextId() });
    this.store.cars.set(created.id, created);
    return copyCar(created);
  }

  async update(car) {
    if (!this.store.cars.has(car.id)) {
      return null;
    }

    this.#assertUniqueLicensePlate(car);
    this.store.cars.set(car.id, copyCar(car));
    return copyCar(car);
  }

  async delete(id) {
    if (this.store.usagesOf('car', id).length > 0) {
      throw new CarHasUsagesError();
    }

    return this.store.cars.delete(id);
  }

  async findById(id) {
    const car = this.store.cars.get(id);
    return car ? copyCar(car) : null;
  }

  async list({ color, brand }) {
    return [...this.store.cars.values()]
      .filter((car) => color === undefined || sameText(car.color, color))
      .filter((car) => brand === undefined || sameText(car.brand, brand))
      .sort((left, right) => left.id - right.id)
      .map(copyCar);
  }
}

export class InMemoryDriverRepository extends DriverRepository {
  constructor(store) {
    super();
    this.store = store;
  }

  async create(driver) {
    const created = new Driver({ ...driver, id: this.store.nextId() });
    this.store.drivers.set(created.id, created);
    return copyDriver(created);
  }

  async update(driver) {
    if (!this.store.drivers.has(driver.id)) {
      return null;
    }

    this.store.drivers.set(driver.id, copyDriver(driver));
    return copyDriver(driver);
  }

  async delete(id) {
    if (this.store.usagesOf('driver', id).length > 0) {
      throw new DriverHasUsagesError();
    }

    return this.store.drivers.delete(id);
  }

  async findById(id) {
    const driver = this.store.drivers.get(id);
    return driver ? copyDriver(driver) : null;
  }

  async list({ name }) {
    return [...this.store.drivers.values()]
      .filter(
        (driver) => name === undefined || driver.name.toLowerCase().includes(name.toLowerCase()),
      )
      .sort((left, right) => left.name.localeCompare(right.name) || left.id - right.id)
      .map(copyDriver);
  }
}

export class InMemoryCarUsageRepository extends CarUsageRepository {
  constructor(store) {
    super();
    this.store = store;
  }

  #assertAvailable(newUsage) {
    const overlapsWith = (field) =>
      this.store
        .usagesOf(field, newUsage[field].id)
        .some((usage) => periodsOverlap(usage, newUsage));

    if (overlapsWith('car')) {
      throw new CarUnavailableError();
    }

    if (overlapsWith('driver')) {
      throw new DriverUnavailableError();
    }
  }

  async start(carUsage) {
    this.#assertAvailable(carUsage);
    const created = copyCarUsage({ ...carUsage, id: this.store.nextId() });
    this.store.carUsages.set(created.id, created);
    return copyCarUsage(created);
  }

  async finish({ id, endDate }) {
    const stored = this.store.carUsages.get(id);

    if (stored.isFinished) {
      throw new CarUsageAlreadyFinishedError();
    }

    stored.endDate = endDate;
    return copyCarUsage(stored);
  }

  async findById(id) {
    const usage = this.store.carUsages.get(id);
    return usage ? copyCarUsage(usage) : null;
  }

  async list() {
    return [...this.store.carUsages.values()]
      .sort((left, right) => right.startDate - left.startDate || right.id - left.id)
      .map(copyCarUsage);
  }
}

export class FixedClock extends Clock {
  constructor(now) {
    super();
    this.current = now;
  }

  now() {
    return this.current;
  }
}

export class StubHealthIndicator extends HealthIndicator {
  constructor(healthy = true) {
    super();
    this.healthy = healthy;
  }

  async isHealthy() {
    return this.healthy;
  }
}

export function createInMemoryUseCases({
  now = new Date('2026-01-10T20:00:00Z'),
  healthy = true,
} = {}) {
  const store = new InMemoryStore();
  const dependencies = {
    carRepository: new InMemoryCarRepository(store),
    driverRepository: new InMemoryDriverRepository(store),
    carUsageRepository: new InMemoryCarUsageRepository(store),
    healthIndicator: new StubHealthIndicator(healthy),
    clock: new FixedClock(now),
  };

  return { ...createUseCases(dependencies), store, now };
}
