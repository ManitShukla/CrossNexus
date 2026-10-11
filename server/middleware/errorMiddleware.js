/**
 * Tactical Error Boundary Middleware
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'SECTOR_NOT_FOUND',
    code: 'ROUTE_NOT_FOUND',
    message: `Target route ${req.method} ${req.originalUrl} does not exist on this tactical host.`,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  console.error('\x1b[31m%s\x1b[0m', `[TACTICAL_EXCEPTION] ${err.name || 'Error'}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error('\x1b[90m%s\x1b[0m', err.stack);
  }
  res.status(statusCode).json({
    status: 'SYSTEM_ERROR',
    code: err.code || 'INTERNAL_TELEMETRY_FAILURE',
    message: err.message || 'An unhandled tactical error occurred.',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFoundHandler, errorHandler };