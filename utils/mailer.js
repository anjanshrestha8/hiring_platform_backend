const nodemailer = require('nodemailer');
const EmailLog = require('../models/Email');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('email', process.env.EMAIL_USER);

const sendMail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"HR Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    await EmailLog.create({
      to,
      subject,
      message: text || html || 'No message provided',
      status: 'Sent',
    });
    console.log('Email sent to:', to);
  } catch (error) {
    await EmailLog.create({
      to,
      subject,
      message: text || html || 'No message provided',
      status: 'Failed',
      errorMessage: error.message,
    });

    console.error('Error sending email:', error);
  }
};

module.exports = sendMail;
