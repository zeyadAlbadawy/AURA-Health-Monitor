const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');

const passedParams = {};

const sendMail = async (opt) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USER_NAME,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });
  const html = pug.renderFile(
    path.join(__dirname, '..', 'public', 'views', 'mails', 'otpMail.pug'),
    {
      otp: opt.otp,
      userName: opt.userName,
    }
  );

  const sendMailOptions = {
    from: 'AURA Bracelet <AuraBracelet@gmail.com>',
    to: opt.email,
    subject: opt.subject,
    text: opt.message,
    html,
  };

  await transporter.sendMail(sendMailOptions);
};

const mailPrep = async (user, userName, otp) => {
  const mailOpt = {
    email: user.email,
    subject: `OTP Verification Valid for (10) min, please hurry up`,
    message: `your otp is  ${otp} `,
    otp,
    userName,
  };
  passedParams.otp = otp;
  passedParams.userName = userName;
  await sendMail(mailOpt);
};
module.exports = { mailPrep, sendMail };
