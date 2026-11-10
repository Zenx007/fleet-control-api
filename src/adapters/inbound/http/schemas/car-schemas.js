import { z } from 'zod';
import { isValidLicensePlate } from '../../../../domain/license-plate.js';
import { text, textFilter } from './common-schemas.js';

export const carSchema = z.object({
  licensePlate: text(8).refine(isValidLicensePlate, 'Must follow the format AAA-1234 or AAA1A23.'),
  color: text(50),
  brand: text(50),
});

export const carFiltersSchema = z.object({
  color: textFilter,
  brand: textFilter,
});
