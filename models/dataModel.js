const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true,
  },
  heartRate: {
    type: Number,
    required: true,
  },
  sp02: {
    type: Number,
    required: true,
  },
  temp: {
    type: Number,
    required: true,
  },
  steps: {
    type: Number,
    required: true,
  },
  gps: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: new Date(Date.now()),
  },
});

const Data = mongoose.model('Data', dataSchema);

module.exports = Data;
