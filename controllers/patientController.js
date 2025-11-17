const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
// all the doctors assinged to patient and not assigned to patient
const getAllDoctors = async (req, res, next) => {
  try {
    let doctors = await Doctor.find({ isApproved: true }).populate({
      path: 'userId',
      select: '_id firstName lastName email',
    });
    const formattedAvailableDoctors = [];
    doctors.forEach((doctor) => {
      formattedAvailableDoctors.push({
        doctorId: doctor._id,
        firstName: doctor.userId.firstName,
        lastName: doctor.userId.lastName,
        email: doctor.userId.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        priceSession: doctor.priceSession,
        yearsOfExperience: doctor.yearsOfExperience,
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Doctors profiles retrieved successfully.',
      data: formattedAvailableDoctors,
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

const bookWithDoctor = async (req, res, next) => {
  try {
    const userId = req.user.id; // the userId stored inside the patient model which refers to User model
    const doctorId = req.params.id; // the doctor which this patient try to book with
    const patientDocument = await Patient.findOne({ userId });

    const patientId = patientDocument ? patientDocument._id : null;
    if (!patientId || !doctorId)
      return next(
        new AppError(
          `Thjere is a problem with the booking you are trying to made, try again later! `,
          400
        )
      );

    // search if there is any booking that is not completed yet, simply return an error
    // search if the time is in the future or not
    const { time, notes } = req.body;
    if (!time || !notes)
      return next(new AppError('Booking time and notes is required.', 400));

    const existingBookingNotApproved = await Booking.findOne({
      patientId,
      doctorId,
      status: 'pending',
    });

    if (existingBookingNotApproved)
      return next(
        new AppError(
          `There is a Booking with this doctor waiting approval!`,
          400
        )
      );
    // 1. Check if the input is a string (like the ISO format)
    if (typeof time === 'string') {
      dateObject = new Date(time);
    }
    // 2. Otherwise, treat it as a number (like the Unix timestamp)
    else if (typeof time === 'number') {
      // The number 1763411263 is 10 digits, indicating seconds.
      // We convert it to milliseconds for the JavaScript Date object.
      finalTimestamp = time.toString().length === 10 ? time * 1000 : time;
      dateObject = new Date(finalTimestamp);
    } else {
      // Catches null, undefined, or other non-string/non-number types
      return next(
        new AppError(
          'Invalid time format. Time must be a date string or a number.',
          400
        )
      );
    }

    // 3. Final Validation Check
    // The getTime() method returns NaN for an "Invalid Date" object.
    if (isNaN(dateObject.getTime())) {
      return next(
        new AppError(
          'Invalid booking time provided. Please use a valid timestamp or ISO date string.',
          400
        )
      );
    }

    // 4. Use the valid Date object to get the milliseconds timestamp
    finalTimestamp = dateObject.getTime();

    const bookingCreated = await Booking.create({
      patientId,
      doctorId,
      time: finalTimestamp,
      notes,
    });
    res.status(200).json({
      status: 'success',
      message: 'booking the doctor is succeed',
      data: bookingCreated,
    });
  } catch (err) {
    next(err);
  }
};

// i wanna make booking which allows patient to choose doctor and the status is provided
// if it is confirmed i will allow the patient to make a payment on the session price
// after the session has been completed i wanna changed the status to completed
// then make this doctor no of sessins performed increase by one
module.exports = { getAllDoctors, getMeInfo, bookWithDoctor };
