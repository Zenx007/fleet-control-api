export function translateConstraintError(error, errorsByConstraint) {
  const ErrorType = errorsByConstraint[error.constraint];
  return ErrorType ? new ErrorType() : error;
}
