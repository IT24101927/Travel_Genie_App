const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const isMailConfigured = () => {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass);
};

const getTransporter = () => {
  if (!isMailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();
  if (!mailer) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  await mailer.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
    text
  });

  return { sent: true };
};

module.exports = {
  isMailConfigured,
  sendMail
};
