const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
const bookStatsUpdate = require('../utils/bookingStatsUpdate.js');
const getMeInfo = async (req, res, next) => {
  try {
    // helper

    // Get user id from protect middleware AS the user which is doctor is authenticated
    const userId = req.user.id;

    // Find Doctor linked to that user and populate the data from user and populate reviews
    const doctor = await Doctor.findOne({ userId })
      .populate({
        path: 'userId',
        select: 'firstName lastName email photoUrl role',
      })
      .populate({
        path: 'reviews',
        populate: {
          path: 'patientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName',
          },
        },
      });

    if (!doctor) {
      return next(
        new AppError(`No doctor profile found for user ID: ${userId}`, 404)
      );
    }

    // Format the reviews before sending them in the response

    const formattedReviews = doctor.reviews.map((r) => ({
      id: r._id,
      review: r.review,
      rating: r.rating,
      patientName: `${r.patientId.userId.firstName} ${r.patientId.userId.lastName}`,
    }));

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
      ratingsQuantity: doctor.ratingsQuantity,
      ratingsAverage: doctor.ratingsAverage,
      reviews: formattedReviews,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };

    res.status(200).json({
      status: 'success',
      message: 'Doctor profile retrieved successfully.',
      data: formattedData,
    });
  } catch (err) {
    next(err);
  }
};

// get all booking requests
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

// get the booking by the booking id
const patientBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor.id;
    const bookingId = req.params.id;
    const foundedBooking = await Booking.findOne({ _id: bookingId, doctorId });
    if (!foundedBooking)
      return next(
        new AppError(
          `There is no booking with the provided id, enter a valid one`,
          404
        )
      );
    res.status(200).json({
      status: 'success',
      message: 'booking retrieved successfully',
      data: foundedBooking,
    });
  } catch (err) {
    next(err);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const statusToFind = ['pending', 'rejected'];
    const newStatus = 'approved';
    const updated = await bookStatsUpdate.updateBookingStatus(
      req,
      next,
      statusToFind,
      newStatus
    );

    if (!updated) return; // handled by next()

    res.status(200).json({
      status: 'success',
      message: 'Booking approved successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const statusToFind = ['approved', 'pending'];
    const newStatus = 'rejected';

    const updated = await bookStatsUpdate.updateBookingStatus(
      req,
      next,
      statusToFind,
      newStatus
    );

    if (!updated) return;

    res.status(200).json({
      status: 'success',
      message: 'Booking rejected successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMeInfo,
  patientsRequestsWithMe,
  patientBooking,
  approveBooking,
  rejectBooking,
};
