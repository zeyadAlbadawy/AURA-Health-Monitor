const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT.js');
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const completeProfile = require('../middlewares/completedProfile.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
/////////////// ---------  AUTH  ROUTER ------//////////////////////

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/validate-otp').post(authController.validateOtp);
userRouter
  .route('/logout')
  .post(protectMiddleware.protect, authController.logout);
userRouter.route('/forget-password').post(authController.forgetPassword);
userRouter.route('/reset-password/:token').patch(authController.resetPassword);

//  GOOGLE LOGIN
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

userRouter.route('/getMeee').get((req, res) => {
  res.send({
    status: 'Success',
    message: 'Have a good day',
  });
});

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
