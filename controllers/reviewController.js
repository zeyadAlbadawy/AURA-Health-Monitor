const mongoose = require('mongoose');
const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Doctor = require('./../models/doctorModel');
const Patient = require('./../models/patientModel');

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.doctorId) {
    req.body.doctorId = req.params.doctorId;
  }

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) {
    return next(new AppError('Patient profile not found.', 404));
  }

  req.body.patientId = patient._id;

  const doctor = await Doctor.findById(req.body.doctorId);
  if (!doctor) {
    return next(new AppError('Doctor not found. Invalid doctor ID.', 404));
  }

  const reviewData = {
    review: req.body.review,
    rating: req.body.rating,
    doctorId: req.body.doctorId,
    patientId: patient._id,
  };

  const newReview = await Review.create(reviewData);

  const populated = await Review.findById(newReview._id)
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

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with this Id', 404));
  }

  const writtenBy = review.patientId;

  const patient = await Patient.findOne({ userId: req.user.id });

  if (!writtenBy.equals(patient._id)) {
    return next(new AppError('You can only edit a review you wrote', 403));
  }

  const reviewData = {
    review: req.body.review,
    rating: req.body.rating,
  };

  const newReview = await Review.findByIdAndUpdate(req.params.id, reviewData, {
    new: true,
    runValidators: true,
  })
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

  const formatted = {
    id: newReview._id,
    review: newReview.review,
    rating: newReview.rating,
    doctorName: `${newReview.doctorId.userId.firstName} ${newReview.doctorId.userId.lastName}`,
    doctorId: newReview.doctorId._id,
    patientName: `${newReview.patientId.userId.firstName} ${newReview.patientId.userId.lastName}`,
    patientId: newReview.patientId._id,
    createdAt: newReview.createdAt,
  };

  res.status(200).json({
    status: 'success',
    data: {
      review: formatted,
    },
  });
});
