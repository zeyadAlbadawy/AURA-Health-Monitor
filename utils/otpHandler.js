const crypto = require('crypto');

const generateOtp = () => {
  return Math.floor(Math.random() * 999999);
};
const otpHashingAndStoringIntoDB = async (user) => {
  const otp = generateOtp();
  console.log(otp);
  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp.toString())
    .digest('hex');

  user.otp = hashedOtp;
  user.otpExpirationDate = Date.now() + 10 * 60 * 1000; // Otp Valid for 10 minutes only
  await user.save({ validateBeforeSave: false });
  return otp;
};

module.exports = { otpHashingAndStoringIntoDB };
