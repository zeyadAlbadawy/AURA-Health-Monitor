const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
// all the doctors assinged to patient and not assigned to patient
const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isApproved: true }).populate('userId');
    res.status(200).json({
      status: 'success',
      message: 'Doctors profiles retrieved successfully.',
      data: doctors,
    });
  } catch (err) {
    next(err);
  }
};

const getMeInfo = async (req, res, next) => {
  try {
    // Get user id from protect middleware
    const userId = req.user.id;

    // Find patient linked to that user
    const patient = await Patient.findOne({ userId }).populate({
      path: 'userId',
      select: 'firstName lastName email photoUrl role',
    });

    if (!patient) {
      return next(
        new AppError(`No patient profile found for user ID: ${userId}`, 404)
      );
    }

    // Build clean response
    const formattedData = {
      id: patient._id,
      name: `${patient.userId.firstName} ${patient.userId.lastName}`,
      email: patient.userId.email,
      role: patient.userId.role,
      gender: patient.gender,
      age: patient.age,
      weight: patient.weight,
      photoUrl: patient.userId.photoUrl || null,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
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

// get the doctor that this patient assigned to
const doctorThisPatientAssignedTo = async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
};

// i wanna make booking which allows patient to choose doctor and the status is provided
// if it is confirmed i will allow the patient to make a payment on the session price
// after the session has been completed i wanna changed the status to completed
// then make this doctor no of sessins performed increase by one
module.exports = { getAllDoctors, getMeInfo };
