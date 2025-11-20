const mongoose = require('mongoose');
const Doctor = require('./doctorModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty !!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Doctor',
      required: [true, 'Review must belong to a doctor'],
    },
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Patient',
      required: [true, 'Review must be written by a patient'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// reviewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

// this index is to make sure each patient can write only one review for a certain dr after the appointment

// Query middleware

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'doctor',
//     populate: {
//       path: 'userId',
//       select: 'firstName lastName',
//       strictPopulate: false,
//     },
//     select: '_id',
//   }).populate({
//     path: 'patient',
//     populate: {
//       path: 'userId',
//       select: 'firstName lastName',
//       strictPopulate: false,
//     },
//     select: '_id',
//   });
//   next();
// });

//use a static method to calculate average and total ratings each time a new review is added or deleted or updated

reviewSchema.statics.calcAverageRatings = async function (doctorId) {
  const stats = await this.aggregate([
    {
      $match: { doctorId },
    },
    {
      $group: {
        _id: '$doctorId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Doctor.findByIdAndUpdate(doctorId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.doctorId);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.doctorId);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
