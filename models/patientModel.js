const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  age: {
    type: Number,
    required: [true, 'Please enter you age!'],
  },
  weight: {
    type: Number,
    required: [true, 'please enter your weight!'],
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

const Patient = mongoose.model('Patinet', patientSchema);
module.exports = Patient;
