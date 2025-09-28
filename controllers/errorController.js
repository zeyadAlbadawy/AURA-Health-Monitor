const appError = require('../utils/appError');
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    // Render error page
    res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message });
  }
};

const handleCastError = (err) => {
  return new appError(`Invalid ${err.path} of ${err.value}`, 400);
};

const handleJWTErrorAuth = () =>
  new appError(`Invalid token, Please try to login again`, 401);

const handleJWTExpiredAuth = () =>
  new appError(`The Token has been expired, Please try to login again`, 401);

const handleDupicateFields = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  return new appError(
    `Duplicate fields value of ${value}, please enter another value`,
    400
  );
};

const handleValidationFields = (err) => {
  const message = Object.values(err.errors)
    .map((elm) => elm.message)
    .join('. ');
  return new appError(`${message}`, 400);
};

const sendErrorProd = (err, req, res) => {
  // Operational error means the error we created ourselves that didn't match a certain criteria
  // A) APIS
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Otherwise => unexpected errors don't leak the inforamtion
    return res.status(500).json({
      status: 'Error',
      message: 'Something went wrong!',
    });
  }

  // For RENDERING
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message });
  }

  // Dont leak info if is is not operational
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'try again later!',
  });
};
const globalErrorHandeler = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  // else if (process.env.NODE_ENV === 'production') {
  //   let error = { ...err };
  //   error.message = err.message;
  //   if (err.name === 'CastError') error = handleCastError(err);
  //   if (err.code === 11000) error = handleDupicateFields(err);
  //   if (err.name === 'ValidationError') error = handleValidationFields(err);
  //   if (err.name === 'JsonWebTokenError') error = handleJWTErrorAuth(error);
  //   if (err.name === 'TokenExpiredError') error = handleJWTExpiredAuth(err);
  //   sendErrorProd(error, req, res);
  // }
};

module.exports = globalErrorHandeler;
