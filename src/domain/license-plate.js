import { InvalidLicensePlateError } from './errors.js';

const LICENSE_PLATE_FORMAT = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;

const standardize = (value) => value.trim().toUpperCase();

export const isValidLicensePlate = (value) => LICENSE_PLATE_FORMAT.test(standardize(value));

export function normalizeLicensePlate(value) {
  if (!isValidLicensePlate(value)) {
    throw new InvalidLicensePlateError();
  }

  return standardize(value).replace('-', '');
}
