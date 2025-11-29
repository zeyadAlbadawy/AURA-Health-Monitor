// config/passport.js
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleStrategyVersion = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://127.0.0.1:3000/api/v1/users/auth/profile',
    passReqToCallback: true,
  },
  async function (request, accessToken, refreshToken, profile, done) {
    try {
      const role = request.query.state || 'patient';
      if (!profile._json.email)
        return done(
          new AppError(`The current user doesn't have an email`, 400)
        );

      let user = await User.findOne({ email: profile._json.email });
      if (!user) {
        user = await User.create({
          firstName: profile._json.name.split(' ')[0],
          lastName: profile._json.name.split(' ')[1],
          email: profile._json.email,
          googleId: profile.id,
          role: role === 'doctor' ? 'doctor' : 'patient',
        });
      }

      const refreshToken = jwtCreation.generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
      done(null, user);
    } catch (err) {
      console.log(err);
      return done(new AppError('Google authentication failed', 500), null);
    }
  }
);
googleStrategyVersion.passReqToCallback = true;
passport.use(googleStrategyVersion);

passport.serializeUser((user, done) => done(null, user.id)); // inject the req.user.id here
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
