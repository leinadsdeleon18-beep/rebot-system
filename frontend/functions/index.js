const { defineSecret, defineString } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');

const smtpUrl = defineSecret('RECOVERY_SMTP_URL');
const fromEmail = defineString('RECOVERY_FROM_EMAIL', {
  description: 'Sender email address authorized by the SMTP provider'
});

let transport;

exports.sendRecoveryEmail = onRequest({
  invoker: 'private',
  secrets: [smtpUrl],
  timeoutSeconds: 25
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    return res.sendStatus(405);
  }

  const { to, type, code } = req.body || {};
  const validRecipient = typeof to === 'string' && to.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(to);
  const isCode = type === 'code';
  const validMessage = isCode ? typeof code === 'string' && /^\d{6}$/.test(code) : type === 'confirmation';

  if (!validRecipient || !validMessage) return res.sendStatus(400);

  try {
    if (!transport) {
      const smtp = new URL(smtpUrl.value());
      if (!['smtp:', 'smtps:'].includes(smtp.protocol) || !smtp.hostname || !smtp.username || !smtp.password) {
        throw new Error('Invalid recovery SMTP URL');
      }

      const secure = smtp.protocol === 'smtps:';
      transport = nodemailer.createTransport({
        host: smtp.hostname,
        port: Number(smtp.port || (secure ? 465 : 587)),
        secure,
        requireTLS: !secure,
        auth: {
          user: decodeURIComponent(smtp.username),
          pass: decodeURIComponent(smtp.password)
        },
        connectionTimeout: 8500,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        disableFileAccess: true,
        disableUrlAccess: true
      });
    }

    await transport.sendMail({
      from: { name: 'ReBot · Patubig Elementary School', address: fromEmail.value() },
      to: { address: to, name: '' },
      subject: isCode ? 'Your ReBot password reset code' : 'Your ReBot password was changed',
      text: isCode
        ? `Your ReBot verification code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`
        : 'Your ReBot password was changed. If you did not make this change, contact your school administrator.'
    });
    return res.sendStatus(204);
  } catch (error) {
    logger.error('Recovery email could not be sent', { code: error.code || error.name });
    return res.sendStatus(502);
  }
});
