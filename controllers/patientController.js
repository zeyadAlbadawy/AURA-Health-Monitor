const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
const validateTimeStamp = require('../utils/timeStampValidate.js');
const mongoose = require('mongoose');
const Slot = require('../models/slotModel.js');
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
        ratingsAverage: doctor.ratingsAverage,
        ratingsQuantity: doctor.ratingsQuantity,
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

const requestSlotWithDoctor = async (req, res, next) => {
  try {
    const userId = req.user.id; // from protect middleware
    const patient = await Patient.findOne({ userId });
    const patientId = patient.id;
    const { doctorId, slotId } = req.params;
    const { notes } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(slotId) ||
      !mongoose.Types.ObjectId.isValid(doctorId)
    )
      return next(new AppError('Invalid ID format', 400));

    // Check if the user provide slotid and doctorID
    if (!doctorId || !slotId)
      return next(new AppError(`Invalid slotId and doctorId passed`, 400));

    // check if this slot is owned for this doctor
    const foundedSlot = await Slot.findOne({
      _id: slotId,
      doctorId,
    });

    if (!foundedSlot)
      return next(new AppError('Slot does not exist for this doctor', 404));

    if (foundedSlot.isBooked)
      return next(new AppError('Slot already booked', 400));

    const newCreatedBooking = await Booking.create({
      doctorId,
      patientId,
      slotId,
      notes,
    });

    res.status(201).json({
      status: 'succes',
      message: 'booking request is waiting approval',
      data: newCreatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

// get all my booking history
const myBookings = async (req, res, next) => {
  try {
    const userId = req.user.id; // the userId stored inside the patient model which refers to User model
    const patientDocument = await Patient.findOne({ userId });
    const patientId = patientDocument.id;
    if (!patientId)
      return next(
        new AppError(`There is an error while retriving the data`, 400)
      );
    const foundedBookings = await Booking.find({ patientId }).populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: '_id firstName lastName email specialization ',
      },
      select: 'specialization licenseNumber yearsOfExperience priceSession',
    });

    const formattedBooking = foundedBookings.map((booking) => ({
      bookingId: booking._id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,

      doctor: {
        doctorId: booking.doctorId._id,
        firstName: booking.doctorId?.userId?.firstName,
        lastName: booking.doctorId?.userId?.lastName,
        email: booking.doctorId?.userId?.email,
        specialization: booking.doctorId?.specialization,
        licenseNumber: booking.doctorId?.licenseNumber,
        yearsOfExperience: booking.doctorId?.yearsOfExperience,
        priceSession: booking.doctorId?.priceSession,
      },
    }));

    res.status(200).json({
      status: 'success',
      length: foundedBookings.length,
      data: formattedBooking,
    });
  } catch (err) {
    next(err);
  }
};

// get the booking detail by its id
const myBooking = async (req, res, next) => {
  try {
    const userId = req.user.id; // the userId stored inside the patient model which refers to User model
    const patientDocument = await Patient.findOne({ userId });
    const patientId = patientDocument.id;
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId))
      return next(new AppError('Invalid review ID format', 400));

    const foundedBooking = await Booking.findOne({
      _id: bookingId,
      patientId,
      status: {
        $in: ['pending', 'confirmed', 'rejected', 'completed', 'approved'],
      },
    });

    if (!foundedBooking)
      return next(
        new AppError(
          `There is no booking with the provided id or it may belongs to another patient`,
          404
        )
      );
    res.status(200).json({
      status: 'success',
      message: `booking with id of ${bookingId} retrieved successfully!`,
      data: foundedBooking,
    });
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
    const finalTimestamp = validateTimeStamp.validateTime(time, next);
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

// cancel specifc booking by
// cencel booking mean to change its status to cancelled, so when there is any operation within  the booking must filter
// filter out any booking that has cancelled status
const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.id; // from protect middleware
    const patientDocument = await Patient.findOne({ userId });
    const patientId = patientDocument.id;
    const bookingId = req.params.id;
    if (!bookingId)
      return next(new AppError(`please provide the booking id`, 400));

    const foundedBooking = await Booking.findOne({
      _id: bookingId,
      patientId,
      status: 'pending',
    });

    if (!foundedBooking)
      return next(
        new AppError(
          `There is no booking with the provided id, enter a valid one`,
          404
        )
      );
    foundedBooking.status = 'cancelled'; // soft delete instead of deleting the whole document
    await foundedBooking.save();

    res.status(200).json({
      status: 'success',
      message: 'booking cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

const updateMyBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patientDocument = await Patient.findOne({ userId });
    const patientId = patientDocument.id;
    const bookingId = req.params.id;
    const foundedBooking = await Booking.findOne({
      _id: bookingId,
      patientId,
      status: {
        $in: ['pending'],
      },
    });

    if (!foundedBooking)
      return next(
        new AppError(`There is no booking with the provided id`, 404)
      );

    const updatedDataInput = req.body;
    if (updatedDataInput.time) {
      const finalTimestamp = validateTimeStamp.validateTime(
        updatedDataInput.time,
        next
      );
      foundedBooking.time = finalTimestamp;
    }
    if (updatedDataInput.notes) foundedBooking.notes = updatedDataInput.notes;
    await foundedBooking.save();

    res.status(200).json({
      status: 'success',
      message: 'booking updaeted successfully!',
      data: foundedBooking,
    });
  } catch (err) {
    next(err);
  }
};

// i wanna make booking which allows patient to choose doctor and the status is provided
// if it is confirmed i will allow the patient to make a payment on the session price
// after the session has been completed i wanna changed the status to completed
// then make this doctor no of sessins performed increase by one
module.exports = {
  getAllDoctors,
  requestSlotWithDoctor,
  cancelBooking,
  getMeInfo,
  bookWithDoctor,
  myBookings,
  myBooking,
  updateMyBooking,
};
