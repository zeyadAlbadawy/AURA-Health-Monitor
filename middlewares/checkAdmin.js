const AppError = require('../utils/appError.js');

// require to be protected as req.user comes from the prev middleware
const restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `As a ${req.user.role}, You are not allowed to do this action.`,
          403
        )
      );
    next();
  };
};

module.exports = { restrictTo };
