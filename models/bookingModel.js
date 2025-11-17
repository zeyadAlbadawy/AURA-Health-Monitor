const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patinet',
    required: true,
  },

  doctorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: true,
  },

  time: {
    type: Date,
    required: [true, 'please enter the time of the booking session'],
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'rejected', 'completed'],
    default: 'pending',
  },

  createdAt: {
    type: Date,
    default: new Date(Date.now()),
  },

  updatedAt: {
    type: Date,
    default: new Date(Date.now()),
  },
});

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
