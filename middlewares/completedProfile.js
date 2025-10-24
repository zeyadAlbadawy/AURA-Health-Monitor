const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');

const checkProfileCompletness = async (req, res, next) => {
  try {
    const user = req.user;
    const role = user.role;
    let existingUser = false;
    if (role === 'patient') {
      const foundedPatient = await Patient.findOne({ userId: user.id });
      if (foundedPatient) existingUser = true;
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

// Test for both roles as patient and user
// Redirect to complete profile router
// Choose what is best to apply middleware and make sure it is working
// understanding the workflow
