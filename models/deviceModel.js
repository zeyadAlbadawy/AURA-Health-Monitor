const mongoose = require('mongoose');
const DeviceSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true,
  },
  deviceId: {
    type: String,
    required: [true, 'Cannot make a pairing without the device ID'],
  },
  deviceName: {
    type: String,
  },
  pairedAt: {
    type: Date,
    default: new Date(Date.now()),
  },
});

const Device = mongoose.model('Device', DeviceSchema);
module.exports = Device;
