import { CarUsage } from '../../domain/car-usage.js';
import {
  CarNotFoundError,
  CarUsageNotFoundError,
  DriverNotFoundError,
} from '../../domain/errors.js';

export class StartCarUsage {
  constructor({ carUsageRepository, carRepository, driverRepository }) {
    this.carUsageRepository = carUsageRepository;
    this.carRepository = carRepository;
    this.driverRepository = driverRepository;
  }

  async execute({ driverId, carId, startDate, reason }) {
    const [driver, car] = await Promise.all([
      this.driverRepository.findById(driverId),
      this.carRepository.findById(carId),
    ]);

    if (!driver) {
      throw new DriverNotFoundError();
    }

    if (!car) {
      throw new CarNotFoundError();
    }

    return this.carUsageRepository.start(new CarUsage({ driver, car, startDate, reason }));
  }
}

export class FinishCarUsage {
  constructor({ carUsageRepository, clock }) {
    this.carUsageRepository = carUsageRepository;
    this.clock = clock;
  }

  async execute(id, { endDate }) {
    const carUsage = await this.carUsageRepository.findById(id);

    if (!carUsage) {
      throw new CarUsageNotFoundError();
    }

    carUsage.finish(endDate ?? this.clock.now());

    return this.carUsageRepository.finish(carUsage);
  }
}

export class ListCarUsages {
  constructor({ carUsageRepository }) {
    this.carUsageRepository = carUsageRepository;
  }

  async execute() {
    return this.carUsageRepository.list();
  }
}
