const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
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

module.exports = { protect };
