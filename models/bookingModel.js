const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true,
  },

  doctorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: true,
  },

  slotId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Slot',
    required: true,
  },

  paymentInfo: {
    paymentId: String, // when payment is success // trx
    orderId: String,
    amount: Number,
    method: String, // when paid is success
    paidAt: Date,
  },

  notes: {
    type: String,
    required: [true, 'please provide any additional info for session booking'],
  },

  status: {
    type: String,
    enum: [
      'pending', // patient requested slot → waiting doctor's approval
      'approved', // doctor approved → patient must pay
      'confirmed', // payment done
      'unpaid', // ask for payment but not paid yet
      'cancelled', // patient cancel it
      'rejected', // doctor reject it
      'completed', // doctor make this booking as completed
      'failed', // payment not proceed
    ],
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
