import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

// ================= API URL =================
const API_URL = 'https://rebot-system.onrender.com';

const LandingPage = () => {
  // ================= STATE VARIABLES =================
  // Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // ================= HELPER FUNCTIONS =================
  const resetForgotPasswordState = () => {
    setResetStep(1);
    setResetEmail('');
    setVerificationCode(['', '', '', '', '', '']);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setTimer(0);
    setCanResend(true);
  };

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

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

  // Handle verification code input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-green-600">ReBot</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Revolutionizing Waste Management in Educational Institutions
            </p>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-600 mt-4">Simple steps to manage waste efficiently</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Collect Waste</h3>
            <p className="text-gray-600">Students deposit recyclable waste in smart bins</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Points</h3>
            <p className="text-gray-600">Earn points for every contribution</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎁</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Redeem Rewards</h3>
            <p className="text-gray-600">Exchange points for exciting rewards</p>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-center mb-6">Login to ReBot</h2>
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  setForgotModalOpen(true);
                  resetForgotPasswordState();
                }}
                className="text-green-600 hover:underline text-sm"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setForgotModalOpen(false);
                resetForgotPasswordState();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
            
            {resetError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {resetSuccess}
              </div>
            )}

            {/* Step 1: Email */}
            {resetStep === 1 && (
              <form onSubmit={handleSendVerification}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isSendingCode ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {resetStep === 2 && (
              <div>
                <p className="text-gray-600 mb-4 text-center">
                  Enter the 6-digit code sent to {resetEmail}
                </p>
                <div className="flex justify-center gap-2 mb-6">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-input-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ))}
                </div>
                <button
                  onClick={async () => {
                    const verified = await handleVerifyOTP();
                    if (verified) {
                      setResetStep(3);
                    }
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition mb-3"
                >
                  Verify Code
                </button>
                <div className="text-center">
                  {canResend ? (
                    <button
                      onClick={handleResendCode}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Resend available in {timer}s
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {resetStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    minLength="6"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;