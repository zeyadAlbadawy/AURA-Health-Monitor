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
      role: bodyInput.role,
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
        new AppError(
          `There is no user found with the email of ${email} and password provided`,
          404
        )
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
      message: 'OTP validated successfully. Please complete your profile.',
      data: {
        token,
        // Include a flag or next step instruction for the frontend
        nextStep: '/complete-profile',
      },
    });
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

const updateMyPassword = async (req, res, next) => {
  try {
    const user = req.user; // from protect middleware
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    // 1) Find the current user
    const foundedUser = await User.findById(user.id).select('+password');
    if (!foundedUser) return next(new AppError('User not found', 404));

    // 2) Check current password
    const isCorrect = await foundedUser.correctPassword(
      currentPassword,
      foundedUser.password
    );
    if (!isCorrect)
      return next(new AppError('Your current password is wrong', 401));

    // 3) Update password
    foundedUser.password = newPassword;
    foundedUser.passwordConfirm = passwordConfirm;

    // 4) Remove refresh token to force logout on all devices
    foundedUser.refreshToken = undefined;
    await foundedUser.save();

    // 5) Clear cookie
    res.clearCookie('refreshJwtToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    // 6) Respond
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  logout,
  validateOtp,
  forgetPassword,
  resetPassword,
  refreshToken,
  updateMyPassword,
};
