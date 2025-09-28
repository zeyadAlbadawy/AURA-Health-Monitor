const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    maxLength: [20, 'A user name must be at most 20 char'],
  },

  lastName: {
    type: String,
    maxLength: [20, 'A user name must be at most 20 char'],
  },

  email: {
    type: String,
    lowercase: true,
    required: [true, 'please provide your email'],
    unique: [true, 'There is another registered user with this email'],
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  photoUrl: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minLength: [8, 'The password should be greater than 8'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User Password Confirmation is required'],
    // works on create and save
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: `The Passwords Does not match`,
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient',
  },
  refreshToken: {
    type: String,
  },
  // For passoword reset
  passwordResetToken: String,
  passwordExpiredResetToken: Date,

  // for otp
  otp: { type: String },
  otpExpirationDate: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: new Date(Date.now()),
  },
});

// Hash the password before saving it into DB
UserSchema.pre('save', async function (next) {
  // if the password is not modified so there is no need to run this, simply jump into the next middleware
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// correct password which is available on all user instancess
// This check that the entered user password after hashing will be equal to the hashed one in DB
UserSchema.methods.correctPassword = async function (
  enteredPassword,
  hashedPassword
) {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
