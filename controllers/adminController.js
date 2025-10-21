const Doctor = require('../models/doctorModel.js');
const AppError = require('../utils/appError.js');

const approveDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const foundedDoctor = await Doctor.findById(doctorId).populate('userId');
    if (!foundedDoctor)
      return next(
        new AppError(
          'Doctor not found with the provided id, try again later or the profile is not completed.',
          404
        )
      );

    if (!foundedDoctor?.isCompleted)
      return next(
        new AppError(
          'This doctor cannot be approved because their profile is incomplete',
          400
        )
      );

    foundedDoctor.isApproved = true;
    await foundedDoctor.save();

    res.status(200).json({
      status: 'success',
      message: `Doctor ${foundedDoctor.userId.firstName} ${foundedDoctor.userId.lastName} approved successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({
      status: 'Success',
      message: {
        data: doctors,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { approveDoctor, getAllDoctors };
