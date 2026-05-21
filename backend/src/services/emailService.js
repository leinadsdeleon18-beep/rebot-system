const axios = require('axios');

const sendOTPEmail = async (email, otp, fullName) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  const data = {
    sender: {
      name: 'ReBot Recycling System',
      email: process.env.EMAIL_FROM || 'noreply@rebot.ph'
    },
    to: [{ email: email, name: fullName }],
    subject: 'Password Reset OTP - ReBot Recycling System',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5a3f, #1e3c2c); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #2d5a3f; text-align: center; padding: 20px; letter-spacing: 8px; background: white; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>♻️ ReBot Recycling System</h2>
            <p>Patubig Elementary School</p>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>We received a request to reset your password for your ReBot account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-code">${otp}</div>
            <p>This OTP will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Patubig Elementary School - ReBot Program</p>
            <p>Smart Recycling for Smarter Schools</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    console.log('✅ OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.response?.data || error.message);
    return false;
  }
};

const sendPasswordResetConfirmation = async (email, fullName) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  const data = {
    sender: {
      name: 'ReBot Recycling System',
      email: process.env.EMAIL_FROM || 'noreply@rebot.ph'
    },
    to: [{ email: email, name: fullName }],
    subject: 'Password Reset Successful - ReBot Recycling System',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5a3f, #1e3c2c); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>♻️ ReBot Recycling System</h2>
            <p>Patubig Elementary School</p>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact your system administrator immediately.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Patubig Elementary School - ReBot Program</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    console.log('✅ Confirmation email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Confirmation email error:', error.response?.data || error.message);
    return false;
  }
};

module.exports = { sendOTPEmail, sendPasswordResetConfirmation };