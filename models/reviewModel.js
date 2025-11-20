const mongoose = require('mongoose');
const Doctor = require('./doctorModel');
const Patient = require('./patientModel');

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

// reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
