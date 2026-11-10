export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidValueError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class BusinessRuleError extends DomainError {}

export class InvalidLicensePlateError extends InvalidValueError {
  constructor() {
    super('License plate must follow the format AAA-1234 or AAA1A23.');
  }
}

export class CarNotFoundError extends NotFoundError {
  constructor() {
    super('Car not found.');
  }
}

export class DriverNotFoundError extends NotFoundError {
  constructor() {
    super('Driver not found.');
  }
}

export class CarUsageNotFoundError extends NotFoundError {
  constructor() {
    super('Car usage not found.');
  }
}

export class DuplicateLicensePlateError extends ConflictError {
  constructor() {
    super('A car with this license plate already exists.');
  }
}

export class CarHasUsagesError extends ConflictError {
  constructor() {
    super('The car has usage records and cannot be deleted.');
  }
}

export class DriverHasUsagesError extends ConflictError {
  constructor() {
    super('The driver has usage records and cannot be deleted.');
  }
}

export class CarUnavailableError extends ConflictError {
  constructor() {
    super('The car is already being used by a driver during this period.');
  }
}

export class DriverUnavailableError extends ConflictError {
  constructor() {
    super('The driver is already using a car during this period.');
  }
}

export class CarUsageAlreadyFinishedError extends ConflictError {
  constructor() {
    super('This car usage has already been finished.');
  }
}

export class InvalidUsagePeriodError extends BusinessRuleError {
  constructor() {
    super('The end date must be later than the start date.');
  }
}
