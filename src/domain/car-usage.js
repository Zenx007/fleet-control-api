import { CarUsageAlreadyFinishedError, InvalidUsagePeriodError } from './errors.js';

export class CarUsage {
  constructor({ id = null, driver, car, startDate, endDate = null, reason }) {
    this.id = id;
    this.driver = driver;
    this.car = car;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }

  get isFinished() {
    return this.endDate !== null;
  }

  finish(endDate) {
    if (this.isFinished) {
      throw new CarUsageAlreadyFinishedError();
    }

    if (endDate <= this.startDate) {
      throw new InvalidUsagePeriodError();
    }

    this.endDate = endDate;
  }
}
