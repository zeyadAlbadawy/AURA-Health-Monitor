const User = require('../models/userModel');
const AppError = require('../utils/appError');
const tokenGeneration = require('../utils/createSendJWT');
const otpGenerate = require('../utils/otpHandler');
const crypto = require('crypto');
const mailSend = require('../utils/mail');
// Signup and login will need the jwt to be sent and stores inside the session ALSO Apply OTP
// Apply  global error handler
const signup = async (req, res, next) => {
  try {
    // 1) Check if there is any user with this email
    const bodyInput = req.body;
    const foundedUser = await User.findOne({ email: bodyInput.email });
    if (foundedUser)
      return next(new AppError('There is a user with this email', 400));
    // 2) create the new user
    const user = await User.create({
      firstName: bodyInput.firstName,
      lastName: bodyInput.lastName,
      email: bodyInput.email,
      password: bodyInput.password,
      passwordConfirm: bodyInput.passwordConfirm,
    });

    // Otp creation
    const otp = await otpGenerate.otpHashingAndStoringIntoDB(user);

    // Mail Sending
    await mailSend.mailPrep(user, user.firstName, otp);

    // Send The Token ===================================
    res.status(201).json({
      status: 'sucess',
      message:
        'otp sent successfully try sign attemp POST req to /validate-otp',
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const foundedUser = await User.findOne({ email: email }).select(
      '+password'
    );
    if (
      !foundedUser ||
      !(await foundedUser.correctPassword(password, foundedUser.password))
    )
      return next(
        new AppError(`There is no user found with the email of ${email}`, 404)
      );
    // Send the token
    res.status(200).json({
      status: 'Success',
      message: { data: '123' },
    });
  } catch (err) {
    next(err);
  }
};

// This validates the otp send it requires mail and otp
const validateOtp = async (req, res, next) => {
  try {
    // 1) Get the mail of the user trying to validate otp throught
    const { email, otp } = req.body;
    // 2) hash the entered otp using crypto then comparing with the stored otp
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp.toString())
      .digest('hex');

    //quantity: { $gt: 20 }

    const foundedUser = await User.findOne({
      email,
    });

    if (!foundedUser)
      return next(new AppError(`No user found with the mail of ${email}`));

    // 3) Check if OTP exists
    if (!foundedUser.otp || !foundedUser.otpExpirationDate) {
      return next(new AppError('No OTP request found for this account', 400));
    }

    // 4) Check if OTP expired
    if (foundedUser.otpExpirationDate < Date.now()) {
      return next(
        new AppError('OTP has expired. Please request a new one.', 400)
      );
    }

    // 5) Compare OTP
    if (foundedUser.otp !== hashedOtp) {
      return next(new AppError('Invalid OTP. Please try again.', 400));
    }

    // 3) if the comoparison works and the 10 min not passed then you should send the token to the user

    foundedUser.otp = undefined;
    foundedUser.otpExpirationDate = undefined;

    // Create send token
    console.log(foundedUser._id);
    const token = tokenGeneration.generateAccessToken(foundedUser._id);
    foundedUser.refreshToken = tokenGeneration.generateRefreshToken();

    await foundedUser.save({ validateBeforeSave: false });

    // Store the cookie in the browser storage for rendering purposes
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({
      status: 'success',
      message: {
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const findAllUsers = async (req, res, next) => {
  const user = await User.findOne({ email: 'zed@example.com' });
  // console.log(user.id);
};
const protect = async (req, res, next) => {};
const logout = () => {};
module.exports = { signup, login, protect, logout, validateOtp, findAllUsers };
