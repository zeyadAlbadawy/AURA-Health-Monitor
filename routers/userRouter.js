const express = require('express');
const userRouter = express.Router();
const authController = require('../controllers/authController');
module.exports = userRouter;

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/validate-otp').post(authController.validateOtp);
userRouter.route('/logout').post(authController.protect, authController.logout);
userRouter.route('/forget-password').post(authController.forgetPassword);
userRouter.route('/reset-password/:token').patch(authController.resetPassword);
userRouter
  .route('/refresh-token')
  .get(authController.protect, authController.refreshToken);
