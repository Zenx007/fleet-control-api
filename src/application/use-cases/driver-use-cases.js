import { Driver } from '../../domain/driver.js';
import { DriverNotFoundError } from '../../domain/errors.js';

export class CreateDriver {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async execute(data) {
    return this.driverRepository.create(new Driver(data));
  }
}

export class UpdateDriver {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async execute(id, data) {
    const driver = await this.driverRepository.update(new Driver({ ...data, id }));

    if (!driver) {
      throw new DriverNotFoundError();
    }

    return driver;
  }
}

export class DeleteDriver {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async execute(id) {
    const deleted = await this.driverRepository.delete(id);

    if (!deleted) {
      throw new DriverNotFoundError();
    }
  }
}

export class GetDriver {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async execute(id) {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new DriverNotFoundError();
    }

    return driver;
  }
}

export class ListDrivers {
  constructor({ driverRepository }) {
    this.driverRepository = driverRepository;
  }

  async execute(filters) {
    return this.driverRepository.list(filters);
  }
}
