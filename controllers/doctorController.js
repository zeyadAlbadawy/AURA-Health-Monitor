const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
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

const patientsRequestsWithMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor.id;

    if (!doctor) return next(new AppError('Doctor profile not found.', 404));
    const availableBookings = await Booking.find({
      doctorId,
    })
      .populate({
        path: 'patientId',
        select: 'userId age weight _id',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      })
      .select('-__v');

    const finalBookingRes = availableBookings.map((book) => {
      const patientDetail = book.patientId && book.patientId.userId;
      return {
        bookingId: book._id,
        time: book.time,
        notes: book.notes,
        patientName: patientDetail
          ? `${book.patientId.userId.firstName} ${book.patientId.userId.lastName}.`
          : 'N/A',
        age: book.patientId.age,
        weight: book.patientId.weight,
      };
    });

    res.status(200).json({
      status: 'Success',
      message: 'Patients retrieved successfully!',
      length: finalBookingRes.length,
      data: finalBookingRes,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMeInfo, patientsRequestsWithMe };
