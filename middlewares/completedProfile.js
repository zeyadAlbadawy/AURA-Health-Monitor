const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');

const checkProfileCompletness = async (req, res, next) => {
  try {
    // this happens in the case of complete-profile router only, other wise the req will not set properly
    // if (!req.profileCompleted)
    //   return next(new AppError(`Please Complete your profile first`, 400));

    // for other
    const user = req.user;
    const role = user.role;
    const existingUser = false;
    if (role === 'patient') {
      const foundeedPatient = await Patient.findOne({ userId: user.id });
      if (foundeedPatient) existingUser = true;
    } else if (role === 'doctor') {
      const foundedDoctor = await Doctor.findOne({ userId: user.id });
      if (foundedDoctor && foundedDoctor.isCompleted) existingUser = true;
    }

    if (!existingUser)
      return next(new AppError(`Please Complete your profile first`, 400));
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkProfileCompletness };

// Test for poth roles as patient and user
// Redirect to complete profile router
// Choose what is best to apply middleware and make sure it is working
// understanding the workflow
