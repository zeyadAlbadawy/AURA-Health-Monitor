const mongoose = require('mongoose');
const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },

  specialization: {
    type: String,
    required: [true, 'Please enter the specialization'],
  },

  licenseNumber: {
    type: Number,
    required: [true, 'Pleas Enter the license number'],
  },

  yearsOfExperience: {
    type: Number,
    required: [true, 'Please mention the no of years of experience'],
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

const Doctor = mongoose.model('Doctor', DoctorSchema);
module.exports = Doctor;
