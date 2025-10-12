const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/appError');

const completeProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const role = user?.role;
    let essentialInfo;
    const bodyInpt = req.body;
    if (role === 'patient') {
      const existingPatient = await Patient.findOne({ userId: user.id });
      if (existingPatient)
        return next(new AppError('Patient profile already completed.', 400));

      if (!gender || !age || !weight)
        return next(
          new AppError(
            'Please provide gender, age, and weight to complete your Patient profile.',
            400
          )
        );

      essentialInfo = await Patient.create({
        userId: user.id,
        gender: bodyInpt.gender,
        age: bodyInpt.age,
        weight: bodyInpt.weight,
      });

      req.profileCompleted = true;
    } else if (role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ userId: user.id });
      if (existingDoctor) {
        return next(new AppError('Doctor profile already completed.', 400));
      }

      // 2. Validate essential Doctor fields
      if (
        !bodyInpt.specialization ||
        !bodyInpt.licenseNumber ||
        !bodyInpt.yearsOfExprience
      ) {
        return next(
          new AppError(
            'Please provide specialization,  license number and years of experience an to complete your Doctor profile.',
            400
          )
        );
      }

      // 3. Create the Doctor document with the essential info
      essentialInfo = await Doctor.create({
        userId: user.id, // Reference the newly created User ID
        specialization: bodyInpt.specialization,
        licenseNumber: bodyInpt.licenseNumber,
        yearsOfExperience: bodyInpt.yearsOfExperience, // Optional field
      });
      req.profileCompleted = true;
    } else {
      // Handle other roles or unhandled roles if necessary
      req.profileCompleted = false;
      return next(
        new AppError(
          `Role ${role} is not supported for profile completion.`,
          400
        )
      );
    }

    // Success Response
    res.status(201).json({
      status: 'success',
      message: `${role} profile created successfully!`,
      data: {
        profile: essentialInfo,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { completeProfile };

// instead of putting anything else inside the request the
