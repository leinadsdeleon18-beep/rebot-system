import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // FORCE LIGHT MODE - Remove dark mode completely for landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.setAttribute('data-landing', 'true');

    return () => {
      document.body.removeAttribute('data-landing');
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot password states
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetRole, setResetRole] = useState('teacher');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Donation form states
  const [donationAmount, setDonationAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorMessage, setDonorMessage] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    text: '',
    color: '',
    guidelines: {}
  });

  // Demo user database
  const userDatabase = {
    teacher: { email: 'teacher@rebot.ph', username: 'teacher123', password: 'teacher123', fullName: 'Maria Santos' },
    canteen: { email: 'canteen@rebot.ph', username: 'canteen123', password: 'canteen123', fullName: 'Rosa Mercado' },
    junk: { email: 'junk@rebot.ph', username: 'junk123', password: 'junk123', fullName: 'Juan Reyes' },
    utility: { email: 'utility@rebot.ph', username: 'utility123', password: 'utility123', fullName: 'Utility Staff' },
    admin: { email: 'admin@rebot.ph', username: 'admin123', password: 'admin123', fullName: 'Admin User' }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer for resend code
  useEffect(() => {
    let interval;
    if (resetStep === 2 && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resetStep, timer, canResend]);

  // Check password strength
  const checkPasswordStrength = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasLength = password.length >= 6;

    let strength = 0;
    if (hasLength) strength++;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;

    let text = '';
    let color = '';

    if (password.length === 0) {
      text = '';
      color = '';
    } else if (strength <= 2) {
      text = 'Weak password';
      color = '#d32f2f';
    } else if (strength <= 4) {
      text = 'Medium password';
      color = '#ff9800';
    } else {
      text = 'Strong password';
      color = '#388e3c';
    }

    setPasswordStrength({
      strength,
      text,
      color,
      guidelines: {
        length: hasLength,
        lowercase: hasLower,
        uppercase: hasUpper,
        number: hasNumber,
        special: hasSpecial
      }
    });

    return strength;
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    checkPasswordStrength(e.target.value);
  };

  const generateReferenceNumber = () => {
    const prefix = 'REBOT';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}${day}-${random}`;
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const result = await login(loginUsername, loginPassword);

    if (result.success) {
      setLoginModalOpen(false);
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
      setIsLoggingIn(false);

      const roleRoutes = {
        admin: '/admin',
        teacher: '/teacher',
        canteen: '/canteen',
        junk: '/junk',
        utility: '/utility'
      };

      const redirectPath = roleRoutes[result.user.role] || '/';
      navigate(redirectPath);
    } else {
      setIsLoggingIn(false);
      const creds = userDatabase[selectedRole];
      setLoginError(`Invalid credentials. Demo: ${creds?.username || 'N/A'} / ${creds?.password || 'N/A'}`);
    }
  };

  const quickFillCredentials = (role) => {
    const creds = userDatabase[role];
    if (creds) {
      setSelectedRole(role);
      setLoginUsername(creds.username);
      setLoginPassword(creds.password);
      setLoginError('');
    }
  };

  const resetForgotPasswordState = () => {
    setResetStep(1);
    setResetEmail('');
    setResetRole('teacher');
    setVerificationCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setTimer(60);
    setCanResend(false);
    setResetError('');
    setResetSuccess('');
    setGeneratedCode('');
    setPasswordStrength({ strength: 0, text: '', color: '', guidelines: {} });
  };

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setIsSendingCode(true);
    setResetError('');
    setResetSuccess('');

    const userEmail = userDatabase[resetRole]?.email;

    if (resetEmail === userEmail) {
      const code = generateVerificationCode();
      setGeneratedCode(code);
      setResetSuccess(`Verification code sent to ${resetEmail}!`);
      setResetStep(2);
      setTimer(60);
      setCanResend(false);
      toast.success(`Demo verification code: ${code}`);
    } else {
      setResetError(`No account found with this email for ${resetRole} role. Demo email: ${userDatabase[resetRole]?.email || 'N/A'}`);
    }

    setIsSendingCode(false);
  };

  const handleResendCode = () => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    setTimer(60);
    setCanResend(false);
    setResetError('');
    setResetSuccess(`A new verification code was sent to ${resetEmail}.`);
    toast.success(`New demo code: ${code}`);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetError('');
    const code = verificationCode.join('');

    if (code.length !== 6) {
      setResetError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (code !== generatedCode) {
      setResetError('Invalid verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    toast.success('Password reset successfully!');
    setForgotModalOpen(false);
    setGeneratedCode('');
    resetForgotPasswordState();
    setLoginModalOpen(true);
  };

  const handleDonation = (e) => {
    e.preventDefault();

    let amount = donationAmount;
    if (!amount && customAmount) {
      amount = customAmount;
    }

    if (!amount || parseInt(amount) < 50) {
      toast.error('Please select or enter a valid donation amount (minimum ₱50).');
      return;
    }

    if (!donorEmail) {
      toast.error('Please enter your email address to receive a receipt.');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }

    const reference = generateReferenceNumber();
    setReferenceNumber(reference);
    setSuccessModalOpen(true);

    setDonationAmount('');
    setCustomAmount('');
    setDonorName('');
    setDonorEmail('');
    setDonationPurpose('general');
    setIsAnonymous(false);
    setDonorMessage('');
    setSelectedPaymentMethod(null);

    toast.success('Donation submitted successfully!');
  };

  const handleAmountPreset = (amount) => {
    setDonationAmount(amount);
    setCustomAmount('');
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value.replace(/\D/g, '');
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);
    const newCode = ['', '', '', '', '', ''];

    for (let i = 0; i < digits.length; i++) {
      newCode[i] = digits[i];
    }

    setVerificationCode(newCode);

    const focusIndex = Math.min(digits.length, 5);
    const nextInput = document.getElementById(`otp-${focusIndex}`);
    if (nextInput) nextInput.focus();
  };

  const handleModalClose = (setter) => (e) => {
    if (e.target === e.currentTarget) {
      setter(false);

      if (setter === setLoginModalOpen) {
        setLoginError('');
        setLoginUsername('');
        setLoginPassword('');
      }

      if (setter === setForgotModalOpen) {
        resetForgotPasswordState();
      }
    }
  };

  const roles = [
    { value: 'teacher', label: 'Teacher', icon: 'fas fa-chalkboard-user' },
    { value: 'canteen', label: 'Canteen', icon: 'fas fa-utensils' },
    { value: 'junk', label: 'Junk Shop', icon: 'fas fa-recycle' },
    { value: 'utility', label: 'Utility', icon: 'fas fa-tools' },
    { value: 'admin', label: 'Admin', icon: 'fas fa-user-shield' }
  ];

  const paymentMethods = [
    { method: 'gcash', name: 'GCash', icon: 'fas fa-mobile-alt' },
    { method: 'paymaya', name: 'PayMaya', icon: 'fas fa-credit-card' },
    { method: 'bank', name: 'Bank Transfer', icon: 'fas fa-university' }
  ];

  const amountPresets = [100, 250, 500, 1000, 2500, 5000];

  return (
    <div className="font-sans bg-white text-gray-800">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 bg-white transition-all ${scrolled ? 'shadow-lg' : 'shadow-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="bg-gradient-to-br from-green-600 to-green-700 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl shadow-md transition-transform hover:scale-105">
              ♻️
            </div>
            <div>
              <span className="text-xl font-extrabold text-green-800">ReBot</span>
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                Patubig ES
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-green-700 font-medium transition flex items-center gap-2">
              <i className="fas fa-home text-sm"></i> Home
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-green-700 font-medium transition flex items-center gap-2">
              <i className="fas fa-question-circle text-sm"></i> How It Works
            </a>
            <a href="#donate" className="text-gray-700 hover:text-green-700 font-medium transition flex items-center gap-2">
              <i className="fas fa-hand-holding-heart text-sm"></i> Support Us
            </a>
            <a href="#about" className="text-gray-700 hover:text-green-700 font-medium transition flex items-center gap-2">
              <i className="fas fa-info-circle text-sm"></i> About
            </a>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2 rounded-full border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 transition flex items-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
            <button
              onClick={() => toast.success('Please contact your school administrator to create an account.')}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md flex items-center gap-2"
            >
              <i className="fas fa-user-plus"></i> Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-6">
              <i className="fas fa-leaf text-green-600"></i>
              <span className="text-green-700 text-sm font-medium">Smart Recycling System</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 leading-tight">
              Recycle. Earn.
              <br />
              Build a Greener Future.
              <span className="block text-orange-500 text-2xl md:text-3xl mt-2 flex items-center gap-2">
                <i className="fas fa-school"></i> Patubig Elementary School
              </span>
            </h1>
            <p className="text-gray-600 text-lg mt-4 leading-relaxed">
              ReBot is an intelligent recycling reward system that empowers students of Patubig
              Elementary School to recycle plastic bottles and paper, earn points, and redeem rewards —
              all while making sustainability fun and impactful.
            </p>
            <div className="flex gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-green-700 flex items-center justify-center gap-1">
                  <i className="fas fa-bottle-water text-xl"></i> 15K+
                </div>
                <div className="text-sm text-gray-500">Bottles Recycled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-green-700 flex items-center justify-center gap-1">
                  <i className="fas fa-newspaper text-xl"></i> 2.8K kg
                </div>
                <div className="text-sm text-gray-500">Paper Collected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-green-700 flex items-center justify-center gap-1">
                  <i className="fas fa-users text-xl"></i> 1.2K+
                </div>
                <div className="text-sm text-gray-500">Active Students</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-white rounded-3xl p-8 text-center shadow-xl animate-float">
            <div className="flex justify-center gap-4 mb-4">
              <i className="fas fa-recycle text-6xl text-green-600"></i>
              <i className="fas fa-leaf text-6xl text-green-600"></i>
              <i className="fas fa-robot text-6xl text-green-600"></i>
            </div>
            <p className="font-semibold text-green-700 mt-4 flex items-center justify-center gap-2">
              <i className="fas fa-microchip"></i> Smart Recycling Machine
            </p>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <i className="fas fa-map-marker-alt"></i> Patubig Elementary School
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl text-center hover:shadow-lg transition shadow-md border border-green-100">
              <i className="fas fa-bottle-water text-3xl text-green-600 mb-3 block"></i>
              <h3 className="text-2xl font-extrabold text-green-800">15,234</h3>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                <i className="fas fa-check-circle text-green-500 text-xs"></i> PET Bottles
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl text-center hover:shadow-lg transition shadow-md border border-green-100">
              <i className="fas fa-newspaper text-3xl text-green-600 mb-3 block"></i>
              <h3 className="text-2xl font-extrabold text-green-800">2,845 kg</h3>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                <i className="fas fa-check-circle text-green-500 text-xs"></i> Paper Modules
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl text-center hover:shadow-lg transition shadow-md border border-green-100">
              <i className="fas fa-star text-3xl text-green-600 mb-3 block"></i>
              <h3 className="text-2xl font-extrabold text-green-800">48,921</h3>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                <i className="fas fa-trophy text-green-500 text-xs"></i> Points Earned
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl text-center hover:shadow-lg transition shadow-md border border-green-100">
              <i className="fas fa-cookie-bite text-3xl text-green-600 mb-3 block"></i>
              <h3 className="text-2xl font-extrabold text-green-800">8,942</h3>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                <i className="fas fa-gift text-green-500 text-xs"></i> Rewards Redeemed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
              <i className="fas fa-cogs text-green-600"></i>
              <span className="text-green-700 text-sm font-medium">Simple Process</span>
            </div>
            <h2 className="text-3xl font-bold text-green-800">How ReBot Works</h2>
            <p className="text-gray-500 mt-2">
              Simple steps for Patubig ES students to recycle, earn, and make a difference
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl text-green-700 shadow-md">
                <i className="fas fa-qrcode"></i>
              </div>
              <h3 className="font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">
                  1
                </span>{' '}
                Scan & Identify
              </h3>
              <p className="text-gray-500 text-sm">
                Students scan their unique QR code at the ReBot machine
              </p>
            </div>
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl text-green-700 shadow-md">
                <i className="fas fa-recycle"></i>
              </div>
              <h3 className="font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">
                  2
                </span>{' '}
                Insert Recyclables
              </h3>
              <p className="text-gray-500 text-sm">
                Deposit PET bottles or paper modules into the machine
              </p>
            </div>
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl text-green-700 shadow-md">
                <i className="fas fa-coins"></i>
              </div>
              <h3 className="font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">
                  3
                </span>{' '}
                Earn Points
              </h3>
              <p className="text-gray-500 text-sm">
                Points are automatically credited to student accounts
              </p>
            </div>
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl text-green-700 shadow-md">
                <i className="fas fa-gift"></i>
              </div>
              <h3 className="font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">
                  4
                </span>{' '}
                Redeem Rewards
              </h3>
              <p className="text-gray-500 text-sm">
                Claim biscuits, school supplies, or other incentives
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-amber-400 mb-4 flex items-center gap-2">
                <i className="fas fa-leaf"></i> ReBot @ Patubig ES
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Smart recycling for smarter schools. Empowering students of Patubig Elementary School to
                build a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="text-amber-400 mb-4 flex items-center gap-2">
                <i className="fas fa-link"></i> Quick Links
              </h4>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> About the Program
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Patubig ES
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> FAQs
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Contact Support
              </a>
            </div>
            <div>
              <h4 className="text-amber-400 mb-4 flex items-center gap-2">
                <i className="fas fa-book"></i> Resources
              </h4>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Impact Reports
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Teacher&apos;s Guide
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Privacy Policy
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 transition flex items-center gap-2">
                <i className="fas fa-chevron-right text-xs"></i> Terms of Service
              </a>
            </div>
            <div>
              <h4 className="text-amber-400 mb-4 flex items-center gap-2">
                <i className="fas fa-share-alt"></i> Connect
              </h4>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fab fa-facebook"></i> Facebook
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fab fa-instagram"></i> Instagram
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 mb-2 transition flex items-center gap-2">
                <i className="fas fa-envelope"></i> patubig.es@rebot.ph
              </a>
              <a href="#" className="block text-sm text-gray-400 hover:text-amber-400 transition flex items-center gap-2">
                <i className="fas fa-phone"></i> (044) 123 4567
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2025 ReBot - Patubig Elementary School Recycling Reward System. Together for a greener tomorrow.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4"
          onClick={handleModalClose(setLoginModalOpen)}
        >
          <div className="w-full max-w-5xl rounded-[32px] overflow-hidden bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] animate-modalUp">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] min-h-[640px]">
              {/* Left Panel */}
              <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white p-10">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-amber-300/10 blur-3xl"></div>
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-md">
                    <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-lg">
                      ♻️
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">ReBot Access</p>
                      <p className="text-sm font-semibold">Patubig Elementary School</p>
                    </div>
                  </div>

                  <h2 className="text-4xl font-extrabold leading-tight mb-4">
                    Welcome back to <span className="text-amber-300">ReBot</span>
                  </h2>
                  <p className="text-white/80 leading-relaxed text-sm max-w-md">
                    Sign in to manage recycling activities, monitor points, and access your role-based
                    dashboard.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-10">
                    <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
                      <i className="fas fa-user-shield text-amber-300 text-xl mb-2"></i>
                      <p className="font-semibold text-sm">Role-based access</p>
                      <p className="text-xs text-white/70 mt-1">
                        Admin, teacher, canteen, utility, and junk shop access.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
                      <i className="fas fa-lock text-amber-300 text-xl mb-2"></i>
                      <p className="font-semibold text-sm">Secure login</p>
                      <p className="text-xs text-white/70 mt-1">
                        Protected access with password visibility toggle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 pt-8">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
                    <i className="fas fa-seedling text-amber-300"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Greener actions, smarter rewards</p>
                    <p className="text-xs text-white/70">
                      Encouraging students through recycling incentives.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="relative bg-white p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex lg:hidden items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <i className="fas fa-leaf"></i> ReBot Login
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-800">Sign in</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Choose your role and enter your credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => setLoginModalOpen(false)}
                    className="w-11 h-11 rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => quickFillCredentials(role.value)}
                      className={`group rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                        selectedRole === role.value
                          ? 'border-green-600 bg-green-50 shadow-sm'
                          : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition ${
                          selectedRole === role.value
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-green-700'
                        }`}
                      >
                        <i className={role.icon}></i>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          selectedRole === role.value ? 'text-green-800' : 'text-slate-700'
                        }`}
                      >
                        {role.label}
                      </p>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Username / ID
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-user"></i>
                      </span>
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-green-600 focus:outline-none transition"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-lock"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-green-600 focus:outline-none transition"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
                      Selected role:{' '}
                      <span className="font-semibold text-slate-700">
                        {roles.find((r) => r.value === selectedRole)?.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginModalOpen(false);
                        setForgotModalOpen(true);
                        setResetError('');
                        setResetSuccess('');
                      }}
                      className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline flex items-center gap-2"
                    >
                      <i className="fas fa-key text-xs"></i>
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold shadow-lg shadow-green-200 hover:from-green-700 hover:to-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoggingIn ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right-to-bracket"></i>
                        Login to Dashboard
                      </>
                    )}
                  </button>

                  {loginError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                      <i className="fas fa-circle-exclamation mt-0.5"></i>
                      <span>{loginError}</span>
                    </div>
                  )}
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => toast.success('Please contact your school administrator for account creation.')}
                    className="font-semibold text-green-700 hover:underline"
                  >
                    Contact your school
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4"
          onClick={handleModalClose(setForgotModalOpen)}
        >
          <div className="w-full max-w-2xl rounded-[32px] overflow-hidden bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] animate-modalUp">
            <div className="relative bg-gradient-to-r from-green-700 via-green-800 to-emerald-800 text-white px-6 sm:px-8 py-6">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">Account Recovery</p>
                  <h3 className="text-3xl font-extrabold flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                      <i className="fas fa-shield-halved"></i>
                    </span>
                    Reset Password
                  </h3>
                  <p className="text-sm text-white/80 mt-3 max-w-lg">
                    Recover your account securely using your registered email and a 6-digit verification
                    code.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    resetForgotPasswordState();
                  }}
                  className="w-11 h-11 rounded-2xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition flex items-center justify-center"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Step Indicator */}
              <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                        resetStep >= 1 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Step 1</p>
                      <p className="text-xs text-slate-500">Verify account email</p>
                    </div>
                  </div>
                </div>

                <div className="w-12 sm:w-20 h-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      resetStep === 2 ? 'w-full bg-green-600' : 'w-1/2 bg-green-300'
                    }`}
                  ></div>
                </div>

                <div className="flex-1 flex justify-end">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 text-right">Step 2</p>
                      <p className="text-xs text-slate-500 text-right">Enter code & new password</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                        resetStep === 2 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <i className="fas fa-key"></i>
                    </div>
                  </div>
                </div>
              </div>

              {resetStep === 1 && (
                <form onSubmit={handleSendVerification} className="space-y-5">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-start gap-3">
                    <i className="fas fa-circle-info mt-0.5"></i>
                    <span>
                      Enter your registered email and choose the correct role. A 6-digit verification code
                      will be sent.
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Registered Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-green-600 focus:outline-none transition"
                        placeholder="Enter your registered email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Select Role
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {roles.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setResetRole(role.value)}
                          className={`rounded-2xl border-2 px-3 py-3 text-left transition ${
                            resetRole === role.value
                              ? 'border-green-600 bg-green-50'
                              : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                              resetRole === role.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <i className={role.icon}></i>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">{role.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold shadow-lg shadow-green-200 hover:from-green-700 hover:to-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSendingCode ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Sending verification code...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Send Verification Code
                      </>
                    )}
                  </button>

                  {resetError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                      <i className="fas fa-circle-exclamation mt-0.5"></i>
                      <span>{resetError}</span>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-3">
                      <i className="fas fa-circle-check mt-0.5"></i>
                      <span>{resetSuccess}</span>
                    </div>
                  )}

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotModalOpen(false);
                        setLoginModalOpen(true);
                        resetForgotPasswordState();
                      }}
                      className="text-sm font-semibold text-green-700 hover:underline inline-flex items-center gap-2"
                    >
                      <i className="fas fa-arrow-left"></i>
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Verification code sent</p>
                    <p className="text-xs text-slate-500">
                      Please enter the 6-digit code sent to <span className="font-semibold">{resetEmail}</span>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Verification Code
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOTPPaste}>
                      {verificationCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOTPChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-xl sm:text-2xl font-bold text-slate-800 focus:bg-white focus:border-green-600 focus:outline-none transition shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
                      <span className="text-slate-500 inline-flex items-center gap-2">
                        <i className="fas fa-clock"></i>
                        {canResend ? 'You can resend the code now.' : `Resend available in ${timer}s`}
                      </span>

                      {canResend && (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="font-semibold text-green-700 hover:underline inline-flex items-center gap-2"
                        >
                          <i className="fas fa-rotate-right"></i>
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-lock"></i>
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-green-600 focus:outline-none transition"
                        placeholder="Enter a new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        {showNewPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                      </button>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: passwordStrength.color || '#e5e7eb'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </p>

                    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                        Password requirements
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            passwordStrength.guidelines.length ? 'text-green-700' : 'text-slate-500'
                          }`}
                        >
                          <i className={`fas ${passwordStrength.guidelines.length ? 'fa-circle-check' : 'fa-circle'}`}></i>
                          At least 6 characters
                        </span>
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            passwordStrength.guidelines.lowercase ? 'text-green-700' : 'text-slate-500'
                          }`}
                        >
                          <i className={`fas ${passwordStrength.guidelines.lowercase ? 'fa-circle-check' : 'fa-circle'}`}></i>
                          Lowercase letter
                        </span>
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            passwordStrength.guidelines.uppercase ? 'text-green-700' : 'text-slate-500'
                          }`}
                        >
                          <i className={`fas ${passwordStrength.guidelines.uppercase ? 'fa-circle-check' : 'fa-circle'}`}></i>
                          Uppercase letter
                        </span>
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            passwordStrength.guidelines.number ? 'text-green-700' : 'text-slate-500'
                          }`}
                        >
                          <i className={`fas ${passwordStrength.guidelines.number ? 'fa-circle-check' : 'fa-circle'}`}></i>
                          Number
                        </span>
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            passwordStrength.guidelines.special ? 'text-green-700' : 'text-slate-500'
                          }`}
                        >
                          <i className={`fas ${passwordStrength.guidelines.special ? 'fa-circle-check' : 'fa-circle'}`}></i>
                          Special character
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-check-circle"></i>
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-14 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-green-600 focus:outline-none transition"
                        placeholder="Re-enter your new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        {showConfirmPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold shadow-lg shadow-green-200 hover:from-green-700 hover:to-emerald-800 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-shield-heart"></i>
                    Reset Password
                  </button>

                  {resetError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
                      <i className="fas fa-circle-exclamation mt-0.5"></i>
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep(1);
                        setVerificationCode(['', '', '', '', '', '']);
                        setNewPassword('');
                        setConfirmPassword('');
                        setResetError('');
                        setResetSuccess('');
                      }}
                      className="text-sm font-semibold text-green-700 hover:underline inline-flex items-center gap-2"
                    >
                      <i className="fas fa-arrow-left"></i>
                      Back to verification
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleModalClose(setSuccessModalOpen)}
        >
          <div className="bg-white rounded-3xl max-w-md w-full text-center p-8 shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check-circle text-4xl text-green-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Donation Received!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for supporting Patubig Elementary School students!
            </p>
            <div className="bg-gray-100 p-3 rounded-xl font-mono font-bold text-lg mb-4 flex items-center justify-center gap-2">
              <i className="fas fa-receipt text-green-600"></i> {referenceNumber}
            </div>
            <p className="text-xs text-gray-500 mb-6">
              <i className="fas fa-envelope"></i> A confirmation email has been sent to your email
              address.
            </p>
            <button
              onClick={() => setSuccessModalOpen(false)}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md flex items-center justify-center gap-2 mx-auto"
            >
              <i className="fas fa-check"></i> Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fa-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes modalUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-modalUp {
          animation: modalUp 0.28s ease-out;
        }
      `}</style>
    </div>
  );
}