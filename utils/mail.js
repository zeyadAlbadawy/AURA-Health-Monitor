const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');

module.exports = class Mail {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.from = 'AURA Bracelet <AuraBracelet@gmail.com>';
  }

  createTransport() {
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USER_NAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  async sendMail(template, subject, options = {}) {
    const html = pug.renderFile(
      path.join(__dirname, '..', 'public', 'views', 'mails', `${template}.pug`),
      {
        ...options,
      }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: options.message || '',
      html,
    };

    await this.createTransport().sendMail(mailOptions);
  }

  async sendOTP(otp) {
    return this.sendMail('otpMail', 'OTP Verification (valid 10 min)', {
      otp,
      message: `Your OTP is ${otp}`,
      userName: this.firstName,
    });
  }

  async resetPassword(url) {
    return this.sendMail(
      'forgetPassword',
      'Password Reset Link (Valid for 10 min)',
      {
        url,
      }
    );
  }
};
