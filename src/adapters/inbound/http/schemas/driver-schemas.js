import { z } from 'zod';
import { text, textFilter } from './common-schemas.js';

export const driverSchema = z.object({
  name: text(150),
});

export const driverFiltersSchema = z.object({
  name: textFilter,
});
