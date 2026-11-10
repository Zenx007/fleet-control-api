import { z } from 'zod';

const MAX_ID = 2147483647;
const NULL_CHARACTER = '\u0000';

const fieldError = (typeMessage) => (issue) =>
  issue.input === undefined ? 'Required field.' : typeMessage;

const hasNoNullCharacter = (value) => !value.includes(NULL_CHARACTER);

export const text = (maxLength) =>
  z
    .string({ error: fieldError('Must be a string.') })
    .trim()
    .min(1, 'Must not be empty.')
    .max(maxLength, `Must have at most ${maxLength} characters.`)
    .refine(hasNoNullCharacter, 'Contains invalid characters.');

export const textFilter = z
  .string({ error: 'Must be provided only once.' })
  .trim()
  .refine(hasNoNullCharacter, 'Contains invalid characters.')
  .optional()
  .transform((value) => value || undefined);

export const referenceId = z
  .number({ error: fieldError('Must be a positive integer.') })
  .int('Must be a positive integer.')
  .positive('Must be a positive integer.')
  .max(MAX_ID, 'Invalid identifier.');

export const dateTime = z.iso
  .datetime({
    offset: true,
    error: fieldError('Must be an ISO 8601 date and time with a time zone.'),
  })
  .transform((value) => new Date(value));

const idParams = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer.')
    .transform(Number)
    .refine((value) => value <= MAX_ID, 'Invalid identifier.'),
});

export const getId = (req) => idParams.parse(req.params).id;
