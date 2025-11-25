const express = require('express');
const cors = require('cors');
const userRouter = require('./routers/userRouter');
const adminRouter = require('./routers/adminRouter');
const doctorRouter = require('./routers/doctorRouter');
const patientRouter = require('./routers/patientRouter');
const paymentRouter = require('./routers/paymentRouter');
const reviewRouter = require('./routers/reviewRouter');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const passportConfig = require('./middlewares/google-oauth20');
const cookieParser = require('cookie-parser');
const app = express();
require('./config/passport-config');
app.use(express.json()); // for JSON requests
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(cookieParser());
passportConfig(app); // for google auth
// app.set('view engine', 'pug');
// Common

// SECURED FOR PAYMENT GATEWAYS
// app.use(
//   cors({
//     origin: ['http://localhost:3000'], // allowed origins
//     credentials: true, // allow cookies
//   })
// );
app.use('/api/v1/users/auth/', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/payments', paymentRouter);
// For Web only

// For mobile only

// For not found routers
app.get('/healthz', (req, res) => res.status(200).send('OK'));

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
