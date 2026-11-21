const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth();
let mailClient;

const sendEmail = async (data) => {
  const url = process.env.FIREBASE_RECOVERY_EMAIL_URL?.trim();
  if (!url) {
    console.error('Set FIREBASE_RECOVERY_EMAIL_URL to the private Firebase mail function URL.');
    return false;
  }

  try {
    mailClient ??= await auth.getIdTokenClient(url);
    await mailClient.request({ url, method: 'POST', data, timeout: 28000, retry: false });
    return true;
  } catch (error) {
    console.error('Firebase recovery email request failed:', error.response?.status || error.code || error.name);
    return false;
  }
};

const sendOTPEmail = (to, code) => sendEmail({ to, code, type: 'code' });
const sendPasswordResetConfirmation = (to) => sendEmail({ to, type: 'confirmation' });

module.exports = { sendOTPEmail, sendPasswordResetConfirmation };
