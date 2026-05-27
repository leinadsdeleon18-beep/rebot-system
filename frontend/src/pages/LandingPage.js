// ================= API URL =================
const API_URL = 'https://rebot-system.onrender.com';

// ================= LOGIN =================
const handleLogin = async (e) => {
  e.preventDefault();

  setIsLoggingIn(true);
  setLoginError('');

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.clear();

      localStorage.setItem('token', data.token);
      localStorage.setItem('rebot_user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.fullName}!`);

      setLoginModalOpen(false);

      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');

      const roleMap = {
        administrator: '/admin',
        teacher: '/teacher',
        canteen_staff: '/canteen',
        junk_shop_personnel: '/junk',
        student: '/student',
      };

      const redirectPath = roleMap[data.user.role] || '/';

      window.location.href = redirectPath;
    } else {
      setLoginError(data.message || 'Login failed');
      toast.error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);

    setLoginError('Cannot connect to server.');
    toast.error('Network error');
  } finally {
    setIsLoggingIn(false);
  }
};

// ================= SEND VERIFICATION =================
const handleSendVerification = async (e) => {
  e.preventDefault();

  setIsSendingCode(true);
  setResetError('');
  setResetSuccess('');

  if (!resetEmail) {
    setResetError('Please enter your email');
    setIsSendingCode(false);
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/forgot-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setResetSuccess('Verification code sent to your email!');
      setResetStep(2);
      setTimer(60);
      setCanResend(false);
    } else {
      setResetError(data.message || 'Failed to send verification code');
    }
  } catch (error) {
    console.error('Send verification error:', error);
    setResetError('Network error.');
  } finally {
    setIsSendingCode(false);
  }
};

// ================= RESEND OTP =================
const handleResendCode = async () => {
  setResetError('');
  setResetSuccess('');

  try {
    const response = await fetch(
      `${API_URL}/api/auth/resend-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setResetSuccess('New verification code sent!');
      setTimer(60);
      setCanResend(false);
    } else {
      setResetError(data.message || 'Failed to resend code');
    }
  } catch (error) {
    console.error('Resend code error:', error);
    setResetError('Network error.');
  }
};

// ================= VERIFY OTP =================
const handleVerifyOTP = async () => {
  const code = verificationCode.join('');

  if (code.length !== 6) {
    setResetError(
      'Please enter the complete 6-digit verification code.'
    );
    return false;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          otp: code,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setResetToken(data.resetToken);

      setResetSuccess(
        'OTP verified! You can now reset your password.'
      );

      return true;
    } else {
      setResetError(data.message || 'Invalid verification code');
      return false;
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    setResetError('Network error.');
    return false;
  }
};

// ================= RESET PASSWORD =================
const handleResetPassword = async (e) => {
  e.preventDefault();

  setResetError('');

  if (newPassword.length < 6) {
    setResetError('Password must be at least 6 characters.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setResetError('Passwords do not match.');
    return;
  }

  let token = resetToken;

  if (!token) {
    const verified = await handleVerifyOTP();

    if (!verified) return;

    token = resetToken;
  }

  setIsResetting(true);

  try {
    const response = await fetch(
      `${API_URL}/api/auth/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      toast.success(
        'Password reset successfully! Please login again.'
      );

      setForgotModalOpen(false);

      resetForgotPasswordState();

      setLoginModalOpen(true);
    } else {
      setResetError(data.message || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    setResetError('Network error.');
  } finally {
    setIsResetting(false);
  }
};