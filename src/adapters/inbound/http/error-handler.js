import { ZodError } from 'zod';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  InvalidValueError,
  NotFoundError,
} from '../../../domain/errors.js';

const STATUS_BY_ERROR_TYPE = [
  [InvalidValueError, 400],
  [NotFoundError, 404],
  [ConflictError, 409],
  [BusinessRuleError, 422],
];

const statusOf = (error) =>
  STATUS_BY_ERROR_TYPE.find(([ErrorType]) => error instanceof ErrorType)?.[1] ?? 500;

export function routeNotFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid data.',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error instanceof DomainError) {
    return res.status(statusOf(error)).json({ error: error.message });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body exceeds the allowed size.' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error.' });
}
