class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode; // 404 or 500
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // the error comes from the developer to handle edge cases
    // to not add this to the stack trace of the created object!
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
