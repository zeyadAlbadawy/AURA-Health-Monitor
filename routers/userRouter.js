const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT');
const authController = require('../controllers/authController');

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/validate-otp').post(authController.validateOtp);
userRouter.route('/logout').post(authController.protect, authController.logout);
userRouter.route('/forget-password').post(authController.forgetPassword);
userRouter.route('/reset-password/:token').patch(authController.resetPassword);
userRouter
  .route('/refresh-token')
  .get(authController.protect, authController.refreshToken);

// TESTING GOOGLE LOGIN
userRouter
  .route('/google')
  .get(passport.authenticate('google', { scope: ['profile', 'email'] }));

userRouter.get(
  '/profile',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log(req.user.id);
    console.log('userProfile');
    const token = jwtCreation.generateRefreshToken(req.user.id);

    res.cookie('refreshJwtToken', token);

    res.status(200).send(`<h1>✅ Google Login Successful</h1>
      <p>User ID: ${req.user.id}</p>
      <p>Your refresh token: ${token}</p>`);

    // res.redirect(`http://localhost:3000/success?token=${token}`);
  }
);

module.exports = userRouter;
