const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const getMeInfo = async (req, res, next) => {
  try {
    // Get user id from protect middleware AS the user which is doctor is authenticated
    const userId = req.user.id;

    // Find patient linked to that user
    const doctor = await Doctor.findOne({ userId }).populate({
      path: 'userId',
      select: 'firstName lastName email photoUrl role',
    });

    console.log(doctor);

    if (!doctor) {
      return next(
        new AppError(`No doctor profile found for user ID: ${userId}`, 404)
      );
    }

    // Build clean response
    const formattedData = {
      id: doctor._id,
      name: `${doctor.userId.firstName} ${doctor.userId.lastName}`,
      email: doctor.userId.email,
      role: doctor.userId.role,
      gender: doctor.gender,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      priceSession: doctor.priceSession,
      photoUrl: doctor.userId.photoUrl || null,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };

    res.status(200).json({
      status: 'success',
      message: 'Patient profile retrieved successfully.',
      data: formattedData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMeInfo };
