import { z } from 'zod';
import { dateTime, referenceId, text } from './common-schemas.js';

export const startCarUsageSchema = z.object({
  driverId: referenceId,
  carId: referenceId,
  startDate: dateTime,
  reason: text(500),
});

export const finishCarUsageSchema = z.object({
  endDate: dateTime.optional(),
});
