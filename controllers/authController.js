const User = require('../models/userModel');
const AppError = require('../utils/appError');
const tokenGeneration = require('../utils/createSendJWT');
const jwt = require('jsonwebtoken');
const otpGenerate = require('../utils/otpHandler');
const crypto = require('crypto');
const Mail = require('../utils/mail');
// Signup and login will need the jwt to be sent and stores inside the session ALSO Apply OTP
// Apply  global error handler

const otpCreationAndSending = async (req, res, next, user) => {
  // Otp creation
  const otp = await otpGenerate.otpHashingAndStoringIntoDB(user);

  // Mail Sending
  // await new Mail(user).sendOTP(otp);

  // Send The Token ===================================
  res.status(201).json({
    status: 'sucess',
    message: 'otp sent successfully try sign attemp POST req to /validate-otp',
  });
};
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

    await otpCreationAndSending(req, res, next, user);
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
    await otpCreationAndSending(req, res, next, foundedUser);
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
    const token = tokenGeneration.generateAccessToken(foundedUser.id);
    foundedUser.refreshToken = tokenGeneration.generateRefreshToken(
      foundedUser.id
    );

    await foundedUser.save({ validateBeforeSave: false });

    // Store the cookie in the browser storage for rendering purposes
    // res.cookie('jwt', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    // });

    res.cookie('refreshJwtToken', foundedUser.refreshToken, {
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

// Test
const findAllUsers = async (req, res, next) => {
  // const user = await User.findOne({ email: 'zed@example.com' });
  console.log('hiiii');
};

// For the protected Route
// 1 ) in the login or sign up, we create jwt and send it via respose to the Client
// 2 ) when we try to access any protected Route, we took this JWT token and pass it to the protect handler middleware
//     Throught Authorized Bearer Token Header
// 3 ) Protect Middleware checks if the authorized token exists then it will take it from the header.
// 4 ) Using jwt.verify and passing the secret key to it, will leades to checking the token verification based upon the security key!
//     If not correct it will through an error which will be handled in the global handler middle-ware
// 5 ) after that we still need to check if the user still exists based upon the id stored in JWT Token!
// 6 ) Check if the password has been changed after the token has been issued if so, return error to login again with new JWT!

const protect = async (req, res, next) => {
  try {
    // Get The Token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookie.jwt) {
      token = req.cookie.jwt;
    }

    if (!token)
      return next(new AppError(`You are not logged in, Try Again!`, 400));

    // Verify the founded token if it is valid
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    const foundedUser = await User.findById(decoded.id);
    if (!foundedUser)
      return next(
        new AppError(
          `The User is no longer exist try again with different user`,
          400
        )
      );

    // Check if the user changed his password
    if (foundedUser.isPasswordChanged(decoded.iat))
      return next(
        new AppError(
          `The Current user has changed his password recently, Try Login again!`,
          401
        )
      );

    req.user = foundedUser;
    next();
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // 1) Check if cookie exists
    const cookie = req.cookies;
    if (!cookie?.refreshJwtToken)
      return next(new AppError(`No refresh Cookie Found`, 404));

    const refreshJwtToken = cookie.refreshJwtToken;

    // 2) Find user by the refresh token
    const foundedUser = await User.findOne({ refreshToken: refreshJwtToken });

    // 3) If no user found, clear the cookie anyway
    if (!foundedUser) {
      res.clearCookie('refreshJwtToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      });
      return next(new AppError(`No User found with this refresh token`, 404));
    }

    // 4) Remove token from user in DB
    foundedUser.refreshToken = undefined;
    await foundedUser.save({ validateBeforeSave: false });

    // 5) Clear the cookie from browser
    res.clearCookie('refreshJwtToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    // 6) Send success response
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully!',
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshJwtToken } = req.cookies;
    if (!refreshJwtToken)
      return next(new AppError(`No refresh token found!`, 404));

    const decoded = jwt.verify(refreshJwtToken, process.env.REFRESH_SECRET_KEY);

    console.log(decoded);
    const foundedUser = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshJwtToken,
    });

    if (!foundedUser)
      return next(new AppError(`No User found with this token`, 404));

    const token = tokenGeneration.generateAccessToken(foundedUser.id);
    const refreshToken = tokenGeneration.generateRefreshToken(decoded.id);

    foundedUser.refreshToken = refreshToken;
    await foundedUser.save({ validateBeforeSave: false });

    res.cookie('refreshJwtToken', foundedUser.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({
      status: 'success',
      message: { token },
    });
  } catch (err) {
    next(err);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    // 1) get the email for the account you forget its password
    // 2) create the password reset token and save it
    // 3 ) create the reset URL  and send it via mail
    // 4 )  remove password reset token from DB

    const email = req.body?.email;
    if (!email) return next(new AppError(`Please provide your email`, 400));

    const foundedUser = await User.findOne({ email });
    if (!foundedUser)
      return next(
        new AppError(`There is no User found with the email of ${email}`)
      );

    const token = foundedUser.generateRandomPasswordResetToken();
    await foundedUser.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/auth/reset-password/${token}`;
    await new Mail(foundedUser).resetPassword(resetURL);
    res.status(200).json({
      status: 'success',
      message: 'password reset url sent successfully, check your mail!',
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = req.params?.token;
    const { email, password, passwordConfirm } = req.body;
    if (!token) return next(new AppError(`No Token found`, 404));
    if (!email || !password || !passwordConfirm)
      return next(
        new AppError(
          `Please provide the email and password and password confirm`,
          400
        )
      );
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const foundedUser = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordExpiredResetToken: { $gt: Date.now() },
    });

    if (!foundedUser)
      return next(
        new AppError(`There is no user with the provided credintials`, 404)
      );
    foundedUser.password = password;
    foundedUser.passwordConfirm = passwordConfirm;
    foundedUser.passwordResetToken = undefined;
    foundedUser.passwordExpiredResetToken = undefined;
    await foundedUser.save();
    return res.status(200).json({
      status: 'Success',
      message: 'Password Changed Successfully, try to login',
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  signup,
  login,
  protect,
  logout,
  validateOtp,
  findAllUsers,
  forgetPassword,
  resetPassword,
  refreshToken,
};
