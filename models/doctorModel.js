const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
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
    // For admin usage
    isCompleted: {
      type: Boolean,
      default: false,
    },

    priceSession: {
      type: Number,
      required: [true, 'please mention the price of your session'],
    },

    yearsOfExperience: {
      type: Number,
      required: [true, 'Please mention the no of years of experience'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    noOfSlots: {
      type: Number,
      default: 0,
    },

    ratingsAverage: {
      type: Number,
      default: 3.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },

    isApproved: {
      type: Boolean,
      default: false, // Admin must manually approve
    },

    createdAt: {
      type: Date,
      default: new Date(Date.now()),
    },

    updatedAt: {
      type: Date,
      default: new Date(Date.now()),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DoctorSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'doctorId',
  localField: '_id',
});

const Doctor = mongoose.model('Doctor', DoctorSchema);
module.exports = Doctor;
