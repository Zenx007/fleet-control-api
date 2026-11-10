import { Car } from '../../domain/car.js';
import { CarNotFoundError } from '../../domain/errors.js';

export class CreateCar {
  constructor({ carRepository }) {
    this.carRepository = carRepository;
  }

  async execute(data) {
    return this.carRepository.create(new Car(data));
  }
}

export class UpdateCar {
  constructor({ carRepository }) {
    this.carRepository = carRepository;
  }

  async execute(id, data) {
    const car = await this.carRepository.update(new Car({ ...data, id }));

    if (!car) {
      throw new CarNotFoundError();
    }

    return car;
  }
}

export class DeleteCar {
  constructor({ carRepository }) {
    this.carRepository = carRepository;
  }

  async execute(id) {
    const deleted = await this.carRepository.delete(id);

    if (!deleted) {
      throw new CarNotFoundError();
    }
  }
}

export class GetCar {
  constructor({ carRepository }) {
    this.carRepository = carRepository;
  }

  async execute(id) {
    const car = await this.carRepository.findById(id);

    if (!car) {
      throw new CarNotFoundError();
    }

    return car;
  }
}

export class ListCars {
  constructor({ carRepository }) {
    this.carRepository = carRepository;
  }

  async execute(filters) {
    return this.carRepository.list(filters);
  }
}
