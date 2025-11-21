const Doctor = require('../models/doctorModel');
const Booking = require('../models/bookingModel');
const AppError = require('./appError.js');

const updateBookingStatus = async (req, next, statusToFind, newStatus) => {
  const userId = req.user.id;
  const doctor = await Doctor.findOne({ userId });
  const doctorId = doctor.id;

  const bookingId = req.params.id;

  const foundedBooking = await Booking.findOne({
    _id: bookingId,
    doctorId,
    status: { $in: statusToFind },
  });

  if (!foundedBooking)
    return next(new AppError(`No booking found matching criteria`, 404));

  foundedBooking.status = newStatus;

  await foundedBooking.save({ validateBeforeSave: false });

  return foundedBooking;
};

module.exports = { updateBookingStatus };
