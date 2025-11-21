const mongoose = require('mongoose');
const slotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: [true, 'slot must have a starting time'],
  },
  endTime: {
    type: String,
    required: [true, 'slot must have a ending time'],
  },

  isBooked: {
    type: Boolean,
    default: false,
  },

  isApproved: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});
const Slot = mongoose.model('Slot', slotSchema);
module.exports = Slot;
