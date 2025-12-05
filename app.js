const express = require('express');
const cors = require('cors');
const userRouter = require('./routers/userRouter');
const adminRouter = require('./routers/adminRouter');
const doctorRouter = require('./routers/doctorRouter');
const patientRouter = require('./routers/patientRouter');
const paymentRouter = require('./routers/paymentRouter');
const reviewRouter = require('./routers/reviewRouter');
const deviceRouter = require('./routers/deviceRouter');
const productRouter = require('./routers/productRouter');
const orderRouter = require('./routers/orderRouter');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const passportConfig = require('./middlewares/google-oauth20');
const cookieParser = require('cookie-parser');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const passport = require('passport');
// const facebookAuth = require('./middlewares/facebookAuth');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(cookieParser()); // for JSON requests

app.use(passport.initialize());
require('./config/passport-config');

passportConfig(app); // for google auth

// app.use('/auth/facebook', facebookAuth);
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
app.use('/api/payment/callback', paymentRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);

// Mobile specifc
app.use('/api/v1/mobile/devices', deviceRouter);

// For not found routers
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/socket', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.all('/{*any}', (req, res, next) => {
  next(
    new AppError(
      `The Route ${req.originalUrl} does not found on the server`,
      404
    )
  );
});
app.use(globalErrorHandler);

// Testing Socket

const server = createServer(app);
const io = new Server(server);

// console.log(socket.id);
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});

module.exports = server;
// module.exports = app;
