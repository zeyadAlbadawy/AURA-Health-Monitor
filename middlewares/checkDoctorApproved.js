const Doctor = require('../models/doctorModel.js');

// require protect middleware to be applied before it and complete profile middleware
const checkDoctorApproval = async (req, res, next) => {
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || !doctor.isApproved) {
      return next(
        new AppError('Your account is not approved by admin yet.', 403)
      );
    }
  }
  next();
};

module.exports = { checkDoctorApproval };
