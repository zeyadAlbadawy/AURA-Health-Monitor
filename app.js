const express = require('express');
const userRouter = require('./routers/userRouter');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json()); // for JSON requests
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(cookieParser());

// Common
app.use('/api/v1/users/auth/', userRouter);
// For Web only

// For mobile only

// For not found routers

app.all('/{*any}', (req, res, next) => {
  next(
    new AppError(
      `The Route ${req.originalUrl} does not found on the server`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
