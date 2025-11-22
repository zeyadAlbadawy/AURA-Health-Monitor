const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const Slot = require('../models/slotModel.js');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
const bookStatsUpdate = require('../utils/bookingStatsUpdate.js');
const validateTimeStamp = require('../utils/timeStampValidate.js');
const mongoose = require('mongoose');

// The Slot Approach
const createSlot = async (req, res, next) => {
  try {
    let { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime)
      return next(
        new AppError(
          `As A doctor creating slot, you must provide date, startTime, endTime`,
          400
        )
      );

    // Validate Date And Time
    date = validateTimeStamp.validateTime(date);
    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime))
      return next(
        new AppError(
          `startime and endtime or both are not in a correct format `,
          400
        )
      );

    const doctor = await Doctor.findOne({ userId: req.user.id });
    const doctorId = doctor.id;
    if (doctor.noOfSlots > 10)
      return next(
        new AppError(`You are allowed to create only active 10 slots`, 400)
      );

    const existedSlot = await Slot.findOne({
      doctorId,
      startTime,
      endTime,
      date,
    });

    if (existedSlot)
      return next(
        new AppError(
          `There is another slot in the same time, date. Choose different one`,
          400
        )
      );

    const slot = await Slot.create({
      doctorId,
      date,
      startTime,
      endTime,
    });

    await slot.save();
    doctor.noOfSlots += 1;
    await doctor.save();

    res.status(201).json({
      status: 'success',
      message: 'Slot created successfully',
      data: slot,
    });
  } catch (err) {
    next(err);
  }
};

// for patient and Doctor
const allAvailableSlots = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let doctorId;
    const doctor = await Doctor.findOne({ userId });
    if (doctor) doctorId = doctor.id;
    else doctorId = req.params.doctorId;

    const availableSlots = await Slot.find({ doctorId });

    res.status(200).json({
      status: 'success',
      message: 'slots retrieved successfully',
      length: availableSlots.length,
      date: availableSlots,
    });
  } catch (err) {
    next(err);
  }
};

const getSpecificSlot = async (req, res, next) => {
  try {
    const slotId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(slotId))
      return next(new AppError('Invalid slot ID format', 400));

    const doctor = await Doctor.findOne({ userId: req.user.id });
    const foundedSlot = await Slot.findOne({
      doctorId: doctor.id,
      _id: slotId,
    });

    if (!foundedSlot)
      return next(
        new AppError(
          `There is no slot with an id of ${slotId} or it belongs to a different doctor`,
          404
        )
      );

    res.status(200).json({
      status: 'success',
      message: 'slot info retrieved successfully',
      date: foundedSlot,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slotId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(slotId))
      return next(new AppError('Invalid slot ID format', 400));
    const doctor = await Doctor.findOne({ userId: req.user.id });
    await Slot.findOneAndDelete({
      _id: slotId,
      doctorId: doctor.id,
    });

    doctor.noOfSlots -= 1;
    res.status(204).json({
      status: 'success',
      message: `slot with id of ${slotId} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

const getMeInfo = async (req, res, next) => {
  try {
    // Get user id from protect middleware AS the user which is doctor is authenticated
    // Handle the one coming from patient when click on the doctor profile
    let userId, doctorId;
    if (req.params.id) doctorId = req.params.id;
    else userId = req.user.id;

    // Find Doctor linked to that user and populate the data from user and populate reviews
    const doctor = await Doctor.findOne(userId ? { userId } : { _id: doctorId })
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
      availableSlots: doctor.slots, // add slots for doctor
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
        slotId: book.slotId,
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

const updateBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId))
      return next(new AppError('Invalid review ID format', 400));

    const userId = req.user.id;
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor.id;

    const foundedBooking = await Booking.findOne({ _id: bookingId, doctorId });
    if (!foundedBooking)
      return next(
        new AppError(
          `This booking does not exist or belongs to a different doctor`,
          404
        )
      );

    if (req.body.notes) foundedBooking.notes = req.body.notes;
    await foundedBooking.save({ validateBeforeSave: false, new: true });
    res.status(200).json({
      status: 'success',
      message: 'booking notes updated successfully!',
      data: foundedBooking,
    });
  } catch (err) {
    next(err);
  }
};

const myPatientsApproved = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor.id;

    const foundedBookings = await Booking.find({
      doctorId,
      status: 'approved',
    });

    res.status(200).json({
      status: 'success',
      message: 'approved bookings retrieved successfully',
      data: foundedBookings,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  getMeInfo,
  myPatientsApproved,
  patientsRequestsWithMe,
  patientBooking,
  approveBooking,
  rejectBooking,
  updateBooking,
  // sloooooooooooot
  createSlot,
  allAvailableSlots,
  getSpecificSlot,
  deleteSlot,
};
