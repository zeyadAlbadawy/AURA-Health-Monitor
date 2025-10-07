const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
    required: [
      function () {
        return !this.googleId;
      },
      'Please provide your password',
    ],
    minLength: [8, 'The password should be greater than 8'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [
      function () {
        return !this.googleId;
      },
      ,
      'User Password Confirmation is required',
    ],
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
  passwordChangedAt: Date,
  // for otp
  otp: { type: String },
  otpExpirationDate: {
    type: Date,
  },

  // Google Session Managemet
  googleId: String,
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

// If the user changed his password so it will be checked on the protect middleware
UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now();
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

// Helpful in protect middleware
UserSchema.methods.isPasswordChanged = function (jwtTimeStamp) {
  // jwtTimeStamp is the current decoded timestamp
  if (this.passwordChangedAt) {
    const passwordChanged = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < passwordChanged;
  }
  return false;
};

UserSchema.methods.generateRandomPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash the created token and store it hashed in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // This token is valid for 10 min
  this.passwordExpiredResetToken = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};
const User = mongoose.model('User', UserSchema);
module.exports = User;
