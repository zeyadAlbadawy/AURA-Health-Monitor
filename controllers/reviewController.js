const mongoose = require('mongoose');
const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Doctor = require('./../models/doctorModel');
const Patient = require('./../models/patientModel');

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.params.doctorId) {
    return next(new AppError('Doctor profile not found.', 404));
  }

  const patient = await Patient.findOne({ userId: req.user.id });

  if (!patient) {
    return next(new AppError('Patient profile not found.', 404));
  }

  const doctor = await Doctor.findById(req.params.doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found. Invalid doctor ID.', 404));
  }

  const reviewData = {
    review: req.body.review,
    rating: req.body.rating,
    doctorId: req.params.doctorId,
    patientId: patient._id,
  };

  const newReview = await Review.create(reviewData);

  await newReview.populate([
    {
      path: 'doctorId',
      populate: { path: 'userId', select: 'firstName lastName' },
    },
    {
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName' },
    },
  ]);

  const populated = newReview;

  const formatted = {
    id: populated._id,
    review: populated.review,
    rating: populated.rating,
    doctorName: `${populated.doctorId.userId.firstName} ${populated.doctorId.userId.lastName}`,
    doctorId: populated.doctorId._id,
    patientName: `${populated.patientId.userId.firstName} ${populated.patientId.userId.lastName}`,
    patientId: populated.patientId._id,
    createdAt: populated.createdAt,
  };

  res.status(201).json({
    status: 'success',
    data: {
      review: formatted,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.doctorId) {
    filter = { doctorId: req.params.doctorId };
  }

  const features = new APIFeatures(
    Review.find(filter)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName',
        },
      }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query;

  const formatted = reviews.map((r) => ({
    id: r._id,
    review: r.review,
    rating: r.rating,
    doctorName: `${r.doctorId.userId.firstName} ${r.doctorId.userId.lastName}`,
    doctorId: r.doctorId._id,
    patientName: `${r.patientId.userId.firstName} ${r.patientId.userId.lastName}`,
    patientId: r.patientId._id,
    createdAt: r.createdAt,
  }));

  res.status(200).json({
    status: 'success',
    results: formatted.length,
    data: { reviews: formatted },
  });
});

exports.getReviewById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid review ID format', 400));
  }

  const populatedReview = await Review.findById(req.params.id)
    .populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName',
      },
    })
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'firstName lastName',
      },
    });

  if (!populatedReview) {
    return next(new AppError('No review found with this Id', 404));
  }

  const formatted = {
    id: populatedReview._id,
    review: populatedReview.review,
    rating: populatedReview.rating,
    doctorName: `${populatedReview.doctorId.userId.firstName} ${populatedReview.doctorId.userId.lastName}`,
    doctorId: populatedReview.doctorId._id,
    patientName: `${populatedReview.patientId.userId.firstName} ${populatedReview.patientId.userId.lastName}`,
    patientId: populatedReview.patientId._id,
    createdAt: populatedReview.createdAt,
  };

  res.status(200).json({
    status: 'success',
    data: {
      review: formatted,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid review ID format', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with this Id', 404));
  }

  const writtenBy = review.patientId;

  const patient = await Patient.findOne({ userId: req.user.id });

  if (!writtenBy.equals(patient._id)) {
    return next(new AppError('You can only delete a review you wrote', 403));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid review ID format', 400));
  }

  const [review, patient] = await Promise.all([
    Review.findById(req.params.id),
    Patient.findOne({ userId: req.user.id }),
  ]);

  if (!review) {
    return next(new AppError('No review found with this Id', 404));
  }

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (!review.patientId.equals(patient._id)) {
    return next(new AppError('You can only edit a review you wrote', 403));
  }

  if (req.body.rating !== undefined) {
    review.rating = req.body.rating;
  }

  if (req.body.review !== undefined) {
    review.review = req.body.review;
  }

  const updatedReview = await review.save();

  await updatedReview.populate([
    {
      path: 'doctorId',
      populate: { path: 'userId', select: 'firstName lastName' },
    },
    {
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName' },
    },
  ]);

  const formatted = {
    id: updatedReview._id,
    review: updatedReview.review,
    rating: updatedReview.rating,
    doctorName: `${updatedReview.doctorId.userId.firstName} ${updatedReview.doctorId.userId.lastName}`,
    doctorId: updatedReview.doctorId._id,
    patientName: `${updatedReview.patientId.userId.firstName} ${updatedReview.patientId.userId.lastName}`,
    patientId: updatedReview.patientId._id,
    createdAt: updatedReview.createdAt,
  };

  res.status(200).json({
    status: 'success',
    data: {
      review: formatted,
    },
  });
});
