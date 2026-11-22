import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ChartColumn, Check, CircleAlert,
  Copy, Eye, EyeOff, Gift, LoaderCircle, QrCode, Recycle, School, Utensils, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/apiService';
import toast from 'react-hot-toast';
import './LandingPage.css';

const recyclingSteps = [
  { icon: QrCode, title: 'Scan your QR code', description: 'Use your student QR code to link the deposit to your account.' },
  { icon: Recycle, title: 'Deposit a bottle', description: 'The ReBot machine checks whether the bottle can be accepted.' },
  { icon: ChartColumn, title: 'Earn points', description: 'Accepted bottles add to your points balance.' },
  { icon: Gift, title: 'Redeem a reward', description: 'Use your points at the canteen or save them for later.' }
];

const schoolRoles = [
  { icon: School, title: 'Teachers', description: 'Manage student records and track class activity.' },
  { icon: Utensils, title: 'Canteen staff', description: 'Redeem rewards and manage stock.' },
  { icon: ChartColumn, title: 'Administrators', description: 'Manage accounts, inventory, and reports.' }
];

function Brand() {
  return (
    <a className="rebot-brand" href="#home">
      <span className="rebot-mark"><Recycle size={22} aria-hidden="true" /></span>
      <span><strong>ReBot</strong><small>Patubig Elementary School</small></span>
    </a>
  );
}

function AccountDialog({ title, description, busy, onClose, children }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.querySelector('[data-initial-focus]')?.focus();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="rebot-dialog"
      aria-labelledby="rebot-dialog-title"
      aria-describedby="rebot-dialog-description"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <div className="rebot-dialog-inner">
        <header className="rebot-dialog-header">
          <div>
            <h2 id="rebot-dialog-title">{title}</h2>
            <p id="rebot-dialog-description">{description}</p>
          </div>
          <button type="button" className="rebot-icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

function FormError({ message }) {
  if (!message) return null;
  return <p className="rebot-form-error" role="alert"><CircleAlert size={17} aria-hidden="true" />{message}</p>;
}

function SubmitButton({ busy, children }) {
  return (
    <button className="rebot-button rebot-button-primary rebot-submit" type="submit" disabled={busy}>
      {busy && <LoaderCircle className="rebot-spinner" size={17} aria-hidden="true" />}
      {children}
    </button>
  );
}

function PasswordField({ id, label, inputRef, autoComplete = 'new-password', ...input }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="rebot-field">
      <label htmlFor={id}>{label}</label>
      <div className="rebot-password">
        <input ref={inputRef} id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required {...input} />
        <button type="button" className="rebot-icon-button" aria-label={visible ? 'Hide ' + label.toLowerCase() : 'Show ' + label.toLowerCase()} onClick={() => setVisible(!visible)}>
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function SignIn({ onClose, onReset }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        onClose();
        navigate('/dashboard');
      } else {
        setError(result.error || 'Could not sign in. Please try again.');
      }
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountDialog title="Sign in" description="Use the account provided by your school." busy={busy} onClose={onClose}>
      <form className="rebot-form" onSubmit={handleSubmit}>
        <div className="rebot-field">
          <label htmlFor="rebot-username">Username or student ID</label>
          <input id="rebot-username" name="username" autoComplete="username" autoCapitalize="none" value={username} onChange={(event) => setUsername(event.target.value)} required data-initial-focus />
        </div>
        <PasswordField id="rebot-password" label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <FormError message={error} />
        <SubmitButton busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</SubmitButton>
        <button className="rebot-text-button rebot-form-link" type="button" onClick={onReset} disabled={busy}>Forgot password?</button>
      </form>
    </AccountDialog>
  );
}

const resetErrorMessage = (error) => error.response?.data?.message || 'Could not reach the reset service. Please try again.';
const cleanCode = (value) => value.replace(/\D/g, '').slice(0, 6);

function ResetPassword({ onClose, onSignIn }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [timer, setTimer] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const initialField = useRef(null);
  const passwordScore = [
    password.length >= 6,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ].filter(Boolean).length;
  const passwordStrength = passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong';

  useEffect(() => {
    initialField.current?.focus();
  }, [step]);

  useEffect(() => {
    if (timer === 0) return;
    const timeout = window.setTimeout(() => setTimer(timer - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [timer]);

  const requestCode = async (resend = false) => {
    setBusy(resend ? 'resend' : 'send');
    setError('');
    setStatus('');
    try {
      const { data } = await (resend ? authAPI.resendOtp({ email }) : authAPI.forgotPassword({ email }));
      if (!data.success) {
        setError(data.message || 'Could not send your verification code.');
        return;
      }

      setCode('');
      setResetToken('');
      setStep(2);
      setTimer(60);
      setStatus(data.message);
    } catch (requestError) {
      setError(resetErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy('verify');
    setError('');
    try {
      const { data } = await authAPI.verifyOtp({ email, otp: code });
      if (!data.success || !data.resetToken) {
        setError(data.message || 'Invalid verification code.');
        return;
      }

      setResetToken(data.resetToken);
      setStatus('');
      setStep(3);
    } catch (requestError) {
      setError(resetErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('Choose a shorter password. The limit is 72 bytes.');
      return;
    }

    setBusy('reset');
    try {
      const { data } = await authAPI.resetPassword({ token: resetToken, newPassword: password });
      if (!data.success) {
        setError(data.message || 'Could not reset your password.');
        return;
      }

      toast.success('Password changed. Sign in with your new password.');
      onSignIn();
    } catch (requestError) {
      if (requestError.response?.data?.code === 'RESET_TOKEN_INVALID') {
        setCode('');
        setResetToken('');
        setStep(2);
      }
      setError(resetErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  };

  const changeEmail = () => {
    setCode('');
    setResetToken('');
    setPassword('');
    setConfirmation('');
    setError('');
    setStatus('');
    setStep(1);
  };

  const descriptions = {
    1: 'Enter the email address registered with your ReBot account.',
    2: 'Enter the six-digit code sent to your email.',
    3: 'Choose a new password for your ReBot account.'
  };

  return (
    <AccountDialog
      title="Reset password"
      description={descriptions[step]}
      busy={Boolean(busy)}
      onClose={onClose}
    >
      {step === 1 ? (
        <form className="rebot-form rebot-step" onSubmit={(event) => { event.preventDefault(); requestCode(); }}>
          <div className="rebot-field">
            <label htmlFor="rebot-email">Registered email</label>
            <input ref={initialField} id="rebot-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(busy)} required />
          </div>
          <FormError message={error} />
          <SubmitButton busy={Boolean(busy)}>{busy ? 'Sending code…' : 'Send verification code'}</SubmitButton>
          <button type="button" className="rebot-text-button rebot-form-link" onClick={onSignIn} disabled={Boolean(busy)}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
          </button>
        </form>
      ) : step === 2 ? (
        <form className="rebot-form rebot-step" onSubmit={verifyCode}>
          <div className="rebot-reset-address">
            <span>{email}</span>
            <button type="button" className="rebot-text-button" onClick={changeEmail} disabled={Boolean(busy)}>Change email</button>
          </div>
          {status && <p className="rebot-form-note" role="status">{status}</p>}
          <div className="rebot-field">
            <label htmlFor="rebot-code">Verification code</label>
            <input
              ref={initialField}
              className="rebot-code"
              id="rebot-code"
              name="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => setCode(cleanCode(event.target.value))}
              disabled={Boolean(busy)}
              required
            />
            <div className="rebot-code-help">
              <span>Codes expire after 10 minutes.</span>
              {timer ? <span>Resend in {timer}s</span> : (
                <button type="button" className="rebot-text-button" onClick={() => requestCode(true)} disabled={Boolean(busy)}>
                  {busy === 'resend' ? 'Sending…' : 'Resend code'}
                </button>
              )}
            </div>
          </div>
          <FormError message={error} />
          <SubmitButton busy={Boolean(busy)}>{busy === 'verify' ? 'Verifying…' : 'Verify code'}</SubmitButton>
        </form>
      ) : (
        <form className="rebot-form rebot-step" onSubmit={handleReset}>
          <PasswordField inputRef={initialField} id="rebot-new-password" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} disabled={Boolean(busy)} aria-describedby="rebot-password-hint" />
          <div id="rebot-password-hint" className="rebot-password-hint">
            <span>Use at least 6 characters.</span>
            {password && <span>Strength: {passwordStrength}</span>}
          </div>
          <PasswordField id="rebot-confirm-password" label="Confirm new password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={6} disabled={Boolean(busy)} />
          <FormError message={error} />
          <SubmitButton busy={Boolean(busy)}>{busy === 'reset' ? 'Resetting password…' : 'Reset password'}</SubmitButton>
        </form>
      )}
    </AccountDialog>
  );
}

export default function LandingPage() {
  const [dialog, setDialog] = useState(null);
  const signInTrigger = useRef(null);
  const { clearSession } = useAuth();

  useEffect(clearSession, [clearSession]);

  const openSignIn = (event) => {
    signInTrigger.current = event.currentTarget;
    setDialog('sign-in');
  };

  const closeDialog = () => {
    setDialog(null);
    window.requestAnimationFrame(() => signInTrigger.current?.focus());
  };

  const copyContact = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard.');
    } catch {
      toast.error('Could not copy. You can select and copy the contact details.');
    }
  };

  return (
    <div className="rebot-public" id="home">
      <a className="rebot-skip" href="#rebot-content">Skip to content</a>
      <header className="rebot-header">
        <div className="rebot-wrap rebot-header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
          </nav>
          <button className="rebot-button rebot-button-outline" type="button" onClick={openSignIn}>
            Sign in <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="rebot-content" tabIndex={-1}>
        <section className="rebot-wrap rebot-hero" aria-labelledby="rebot-hero-title">
          <div className="rebot-hero-copy">
            <p className="rebot-kicker"><span aria-hidden="true" /> School recycling program</p>
            <h1 id="rebot-hero-title">Recycle bottles.<br /><em>Earn rewards.</em></h1>
            <p className="rebot-hero-intro">Students at Patubig Elementary can turn empty bottles into points and use them to claim rewards at the school canteen.</p>
            <div className="rebot-hero-actions">
              <button className="rebot-button rebot-button-primary" type="button" onClick={openSignIn}>
                Open dashboard <ArrowRight size={17} aria-hidden="true" />
              </button>
              <a className="rebot-text-button" href="#how-it-works">How it works <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
          </div>

          <figure className="rebot-example">
            <figcaption><span><Recycle size={19} aria-hidden="true" /> Recycling station</span><small>Example</small></figcaption>
            <div className="rebot-example-body">
              <div className="rebot-scan" aria-hidden="true"><QrCode size={46} strokeWidth={1.6} /></div>
              <ul className="rebot-receipt">
                <li><Check size={17} aria-hidden="true" /> Student QR scanned</li>
                <li><Check size={17} aria-hidden="true" /> Bottle accepted</li>
                <li className="rebot-receipt-total"><Gift size={18} aria-hidden="true" /> Points added</li>
              </ul>
            </div>
            <p>Each accepted bottle is recorded in the student’s account.</p>
          </figure>
        </section>

        <section id="how-it-works" className="rebot-process">
          <div className="rebot-wrap">
            <h2>How it works</h2>
            <ol className="rebot-process-list">
              {recyclingSteps.map(({ icon: Icon, title, description }, index) => (
                <li key={title}>
                  <div><span aria-hidden="true">0{index + 1}</span><Icon size={21} aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rebot-wrap rebot-access" aria-labelledby="rebot-access-title">
          <div>
            <h2 id="rebot-access-title">ReBot at school</h2>
            <p>Sign in with your school account to see the tools available to your role.</p>
            <button type="button" className="rebot-text-button" onClick={openSignIn}>Sign in to ReBot <ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <ul>
            {schoolRoles.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <Icon size={21} aria-hidden="true" />
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer id="about" className="rebot-footer">
        <div className="rebot-wrap">
          <div className="rebot-footer-main">
            <div>
              <Brand />
              <p>Need a ReBot account? Contact your school administrator.</p>
            </div>
            <div className="rebot-contact">
              <h2>Contact</h2>
              <button type="button" onClick={() => copyContact('patubig.es@rebot.ph')} aria-label="Copy email address patubig.es@rebot.ph">
                patubig.es@rebot.ph <Copy size={14} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => copyContact('(044) 123 4567')} aria-label="Copy phone number (044) 123 4567">
                (044) 123 4567 <Copy size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="rebot-copyright">© {new Date().getFullYear()} ReBot · Patubig Elementary School</p>
        </div>
      </footer>

      {dialog === 'sign-in' && <SignIn onClose={closeDialog} onReset={() => setDialog('reset')} />}
      {dialog === 'reset' && <ResetPassword onClose={closeDialog} onSignIn={() => setDialog('sign-in')} />}
    </div>
  );
}
