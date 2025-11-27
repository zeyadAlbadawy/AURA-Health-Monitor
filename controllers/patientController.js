const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');
const validateTimeStamp = require('../utils/timeStampValidate.js');
const mongoose = require('mongoose');
const Slot = require('../models/slotModel.js');
const PaymobPayment = require('../utils/payment/paymobPayment.js');
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
        fullNamee: `${booking.doctorId?.userId?.firstName} ${booking.doctorId?.userId?.lastName}`,
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

// const bookWithDoctor = async (req, res, next) => {
//   try {
//     const userId = req.user.id; // the userId stored inside the patient model which refers to User model
//     const doctorId = req.params.id; // the doctor which this patient try to book with
//     const patientDocument = await Patient.findOne({ userId });

//     const patientId = patientDocument ? patientDocument._id : null;
//     if (!patientId || !doctorId)
//       return next(
//         new AppError(
//           `Thjere is a problem with the booking you are trying to made, try again later! `,
//           400
//         )
//       );

//     // search if there is any booking that is not completed yet, simply return an error
//     // search if the time is in the future or not
//     const { time, notes } = req.body;
//     if (!time || !notes)
//       return next(new AppError('Booking time and notes is required.', 400));

//     const existingBookingNotApproved = await Booking.findOne({
//       patientId,
//       doctorId,
//       status: 'pending',
//     });

//     if (existingBookingNotApproved)
//       return next(
//         new AppError(
//           `There is a Booking with this doctor waiting approval!`,
//           400
//         )
//       );
//     const finalTimestamp = validateTimeStamp.validateTime(time, next);
//     const bookingCreated = await Booking.create({
//       patientId,
//       doctorId,
//       time: finalTimestamp,
//       notes,
//     });
//     res.status(200).json({
//       status: 'success',
//       message: 'booking the doctor is succeed',
//       data: bookingCreated,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// cancel specifc booking by
// cencel booking mean to change its status to cancelled, so when there is any operation within  the booking must filter
// filter out any booking that has cancelled status
const cancelBookingSlot = async (req, res, next) => {
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

const updateMyBookingNotes = async (req, res, next) => {
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
// doctorId/request-slot/slot_id
// {{URL}}api/v1/patients/all-available-slots/691e2d37d0a4bc00fe70dcc0/request-slot/692009d39b4d20c61e69a0bd
const makePaymentOfSlot = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { slotId, doctorId, bookingId } = req.params;
    const patientDocument = await Patient.findOne({ userId }).populate({
      path: 'userId',
      select: 'firstName lastName email',
    });
    const patientId = patientDocument.id;

    const foundedSlot = await Slot.findOne({ _id: slotId, doctorId });
    const foundedDoctor = await Doctor.findOne({ _id: doctorId }).populate({
      path: 'userId',
      select: 'firstName lastName email',
    });
    const foundedBooking = await Booking.findOne({
      _id: bookingId,
      doctorId,
      slotId,
      patientId,
    });
    const priceSession = foundedDoctor.priceSession;
    if (!foundedSlot)
      return next(new AppError(`There is no slot with the provided id. `, 404));

    if (!foundedBooking)
      return next(
        new AppError(
          `Please Ask The Doctor to confirm the slot booking first.`,
          400
        )
      );

    if (foundedBooking.status === 'pending')
      return next(
        new AppError(
          `you can not proceed with this payment as the doctor not approved it yet!`,
          400
        )
      );

    if (foundedBooking.status === 'rejected')
      return next(
        new AppError(
          `you can not proceed with this payment as the doctor reject it yet!, try asking for another slot`,
          400
        )
      );

    // Step 1 — Prepare the data for Paymob
    const paymob = new PaymobPayment();
    const paymobBodyInput = {
      amount_cents: `${priceSession * 100}`,
      currency: 'EGP',
      shipping_data: {
        first_name: patientDocument.userId.firstName,
        last_name: patientDocument.userId.lastName,
        email: patientDocument.userId.email,
        phone_number: '01010101010',
      },
      items: [
        {
          name: 'Booing a session with the doctor',
          description: `Booking with doctor ${foundedDoctor.userId.firstName} ${foundedDoctor.userId.lastName}`,
          amount_cents: `${priceSession * 100}`,
          quantity: '1',
        },
      ],
      delivery_needed: 'false',
    };

    req.body = paymobBodyInput;

    // Step 2 — Call Paymob to create the order
    const paymentRes = await paymob.sendPayment(req);

    // Step 3 — Save Paymob order id for webhook verification
    foundedBooking.paymentInfo.orderId = paymentRes?.data?.id;
    foundedBooking.paymentInfo.amount = priceSession * 100;
    foundedBooking.status = 'unpaid'; // ask for payment but not proceed yet!
    await foundedBooking.save();

    // Step 4 — Send payment link to frontend
    res.status(200).json({
      status: 'success',
      message: 'Redirect the user to complete payment.',
      payUrl: paymentRes.data.url,
      orderId: paymentRes.data.id,
    });
  } catch (err) {
    next(err);
  }
};

const paymobWebhookController = async (req, res, next) => {
  try {
    const query = req.query; // Paymob sends all data as query params
    console.log(
      'QUERY⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽⛽'
    );
    console.log(query);
    const foundedBooking = await Booking.findOne({
      'paymentInfo.orderId': query.order,
    });

    if (!foundedBooking)
      return next(
        new AppError(
          `There is an error with the payment of this order or not found`,
          400
        )
      );

    console.log(req.query);

    foundedBooking.status = query.success ? 'confirmed' : 'failed';
    await foundedBooking.save();

    res.status(200).json({
      status: 'success',
      message: 'Webhook processed',
    });
  } catch (err) {
    console.error(err);
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
  cancelBookingSlot,
  getMeInfo,
  myBookings,
  myBooking,
  updateMyBookingNotes,
  makePaymentOfSlot,
  paymobWebhookController,
};
