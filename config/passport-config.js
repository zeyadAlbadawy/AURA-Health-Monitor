// config/passport.js
const passport = require('passport');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://127.0.0.1:3000/api/v1/users/auth/profile',
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        if (!profile._json.email)
          return done(
            new AppError(`The current user doesn't have an email`, 400)
          );

        let user = await User.findOne({ email: profile._json.email });
        if (!user) {
          user = await User.create({
            firstName: profile._json.name,
            email: profile._json.email,
            googleId: profile.id,
          });
        }

        done(null, user);
      } catch (err) {
        return done(new AppError('Google authentication failed', 500), null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
