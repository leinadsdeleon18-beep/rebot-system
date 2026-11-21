const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth();
let mailClient;

const sendThroughBrevo = async ({ to, code, type }) => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    console.error('Password recovery has no configured email provider.');
    return false;
  }

  const isCode = type === 'code';
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'ReBot · Patubig Elementary School', email: process.env.EMAIL_FROM?.trim() || 'noreply@rebot.ph' },
      to: [{ email: to }],
      subject: isCode ? 'Your ReBot password reset code' : 'Your ReBot password was changed',
      textContent: isCode
        ? `Your ReBot verification code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`
        : 'Your ReBot password was changed. If you did not make this change, contact your school administrator.'
    }, {
      timeout: 10000,
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' }
    });
    return true;
  } catch (error) {
    console.error('Brevo recovery email request failed:', error.response?.status || error.code || error.name);
    return false;
  }
};

const sendEmail = async (data) => {
  const url = process.env.FIREBASE_RECOVERY_EMAIL_URL?.trim();
  if (!url) return sendThroughBrevo(data);

  try {
    mailClient ??= await auth.getIdTokenClient(url);
  } catch (error) {
    console.error('Firebase recovery email authentication failed:', error.code || error.name);
    return sendThroughBrevo(data);
  }

  try {
    await mailClient.request({ url, method: 'POST', data, timeout: 28000, retry: false });
    return true;
  } catch (error) {
    const status = error.response?.status;
    console.error('Firebase recovery email request failed:', status || error.code || error.name);
    // These responses mean the private function did not process the email.
    if ([401, 403, 404].includes(status)) return sendThroughBrevo(data);
    return false;
  }
};

const sendOTPEmail = (to, code) => sendEmail({ to, code, type: 'code' });
const sendPasswordResetConfirmation = (to) => sendEmail({ to, type: 'confirmation' });

module.exports = { sendOTPEmail, sendPasswordResetConfirmation };
