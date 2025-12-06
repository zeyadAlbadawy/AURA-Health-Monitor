// config/passport.js
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_SECRET_KEY,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails'],
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, done) {
      try {
        const role = req.query.state || 'patient';
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
          const [firstName, ...rest] = profile.displayName.split(' ');
          const lastName = rest.join(' ');

          user = await User.create({
            facebookId: profile.id,
            firstName,
            lastName,
            email: profile.emails?.[0]?.value,
            role,
          });
        }

        done(null, user);
      } catch (err) {
        return done(new AppError('Facebook authentication failed', 500), null);
      }
    }
  )
);

module.exports = passport;
