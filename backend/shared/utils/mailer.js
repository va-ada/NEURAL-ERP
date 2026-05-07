const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailOTP = async (to, name, otp, type = 'verify') => {
  const subjects = {
    verify: '✅ Verify your Neural ERP account',
    reset:  '🔒 Reset your Neural ERP password',
  };

  const colors = { verify: '#6366f1', reset: '#ef4444' };

  await transporter.sendMail({
    from: `"Neural ERP" <${process.env.SMTP_USER}>`,
    to,
    subject: subjects[type],
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:${colors[type]};padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Neural ERP</h1>
        </div>
        <div style="padding:30px;background:#f9fafb;border-radius:0 0 8px 8px">
          <h2>Hi ${name},</h2>
          <p>Your OTP is:</p>
          <div style="background:white;padding:20px;border-radius:8px;text-align:center;margin:20px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:${colors[type]}">${otp}</span>
          </div>
          <p style="color:#6b7280">Expires in <strong>10 minutes</strong>.</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendEmailOTP };