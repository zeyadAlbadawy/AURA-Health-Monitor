const express = require('express');
const userRouter = express.Router();
const authController = require('../controllers/authController');
module.exports = userRouter;

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/validate-otp').post(authController.validateOtp);
userRouter.route('/all').get(authController.findAllUsers);
