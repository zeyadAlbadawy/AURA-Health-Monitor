const AppError = require('./../utils/appError');
const Patient = require('../models/patientModel');
const Device = require('../models/deviceModel');
const pairDevice = async (req, res, next) => {
  try {
    const userId = req.user.id; // comes from  protect middleware
    const patient = await Patient.findOne({ userId });
    const patientId = patient.id;

    if (!patient)
      return next(
        new AppError(
          'There is an error while retriving patient info, try login again',
          404
        )
      );

    const { deviceId, deviceName } = req.body;
    if (!deviceId)
      return next(
        new AppError(
          `There is an error while connecting, try again later...`,
          400
        )
      );

    const existedPairing = await Device.findOne({ patientId, deviceId });
    if (existedPairing)
      return next(new AppError('Device is already paired', 400));

    const paired = await Device.create({
      patientId,
      deviceId,
      deviceName,
    });

    res.status(201).json({
      status: 'Success',
      message: 'AURA Paired Successfully',
      data: paired,
    });
  } catch (err) {
    next(err);
  }
};

const disconnectDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;

    if (!deviceId) return next(new AppError('Device ID is required', 400));

    const patient = await Patient.findOne({ userId });
    if (!patient)
      return next(
        new AppError(
          'There is an error while retriving patient info, try login again',
          404
        )
      );

    const deleted = await Device.findOneAndDelete({
      patientId: patient.id,
      deviceId,
    });

    if (!deleted)
      return next(
        new AppError('Device not found or already disconnected', 404)
      );

    res.status(200).json({
      status: 'success',
      message: 'Device disconnected successfully',
    });
  } catch (err) {
    next(err);
  }
};

const myPairedDevices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patient = await Patient.findOne({ userId });
    const patientId = patient.id;

    if (!patient)
      return next(
        new AppError(
          `There is an error while retriving patient info, try login again`,
          400
        )
      );
    const pairedDevices = await Device.find({ patientId });
    res.status(200).json({
      status: 'Success',
      message: 'AURA Paired Devices',
      length: pairedDevices.length,
      data: pairedDevices,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = { pairDevice, disconnectDevice, myPairedDevices };
