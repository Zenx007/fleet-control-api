import { FinishCarUsage, ListCarUsages, StartCarUsage } from './use-cases/car-usage-use-cases.js';
import { CreateCar, DeleteCar, GetCar, ListCars, UpdateCar } from './use-cases/car-use-cases.js';
import { CheckHealth } from './use-cases/check-health.js';
import {
  CreateDriver,
  DeleteDriver,
  GetDriver,
  ListDrivers,
  UpdateDriver,
} from './use-cases/driver-use-cases.js';

export function createUseCases(dependencies) {
  return {
    createCar: new CreateCar(dependencies),
    updateCar: new UpdateCar(dependencies),
    deleteCar: new DeleteCar(dependencies),
    getCar: new GetCar(dependencies),
    listCars: new ListCars(dependencies),
    createDriver: new CreateDriver(dependencies),
    updateDriver: new UpdateDriver(dependencies),
    deleteDriver: new DeleteDriver(dependencies),
    getDriver: new GetDriver(dependencies),
    listDrivers: new ListDrivers(dependencies),
    startCarUsage: new StartCarUsage(dependencies),
    finishCarUsage: new FinishCarUsage(dependencies),
    listCarUsages: new ListCarUsages(dependencies),
    checkHealth: new CheckHealth(dependencies),
  };
}
