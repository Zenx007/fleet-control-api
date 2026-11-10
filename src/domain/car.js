import { normalizeLicensePlate } from './license-plate.js';

export class Car {
  constructor({ id = null, licensePlate, color, brand }) {
    this.id = id;
    this.licensePlate = normalizeLicensePlate(licensePlate);
    this.color = color;
    this.brand = brand;
  }
}
