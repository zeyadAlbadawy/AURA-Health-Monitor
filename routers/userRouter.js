const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT.js');
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const completeProfile = require('../middlewares/completedProfile.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
/////////////// ---------  AUTH  ROUTER ------//////////////////////

userRouter.route('/getMeee').get((req, res) => {
  res.send({
    status: 'Success',
    message: 'Have a good day',
  });
});
userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/validate-otp').post(authController.validateOtp);
userRouter
  .route('/logout')
  .post(protectMiddleware.protect, authController.logout);
userRouter.route('/forget-password').post(authController.forgetPassword);
userRouter.route('/reset-password/:token').patch(authController.resetPassword);

//  GOOGLE LOGIN

userRouter.get('/google', (req, res, next) => {
  const role = req.query.role === 'doctor' ? 'doctor' : 'patient'; // get role from query params
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role,
  })(req, res, next);
});

userRouter.get(
  '/profile',
  passport.authenticate('google', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    const token = req.user.refreshToken;
    res.cookie('refreshJwtToken', token);

    res.status(200).json({
      status: 'success',
      message: 'Google Login Successful',
      token,
    });

    // res.redirect(`http://localhost:3000/success?token=${token}`);
  }
);

//facebook login

// Redirect to Facebook
userRouter.get('/facebook', (req, res, next) => {
  const role = req.query.role === 'doctor' ? 'doctor' : 'patient';
  passport.authenticate('facebook', {
    scope: ['email'],
    state: role,
  })(req, res, next);
});

// Facebook callback
userRouter.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: '/login',
  }),
  (req, res) => {
    // User is authenticated, generate JWT
    const token = jwtCreation.generateAccessToken(req.user._id);

    // Optionally set refresh token cookie
    res.cookie('refreshJwtToken', req.user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({
      status: 'success',
      message: 'Facebook Login Successful',
      token,
      role: req.user.role, // just to verify
    });
  }
);

// userRouter
//   .route('/complete-profile')
//   .post(protectMiddleware.protect, authController.completeProfile);

// Routers need to be protected and completed profile.
userRouter.use(protectMiddleware.protect);

userRouter
  .route('/complete-profile')
  .post(doctorPatientController.completeProfile); // must be authenticated

// These routers must be completed profile
userRouter.use(completeProfile.checkProfileCompletness);
userRouter
  .route('/refreshtoken')
  .get(protectMiddleware.protect, authController.refreshToken);

userRouter
  .route('/update-my-password')
  .post(protectMiddleware.protect, authController.updateMyPassword);

// Check the status of the profile
// userRouter.route('/check-status').get();

module.exports = userRouter;

// login
// signup
// validate-otp
// logout
// forget-password, resetpassword
// google auth
// complete-profile
// refreshtoken
// update-password
