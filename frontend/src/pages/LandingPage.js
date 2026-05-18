import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

export default function LandingPage() {
  const auth = useAuth();
  const { user, login } = auth || {};
  const navigate = useNavigate();

  // ========== ALL HOOKS FIRST (BEFORE ANY CONDITIONAL RETURN) ==========
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

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

  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    text: '',
    color: '',
    guidelines: {}
  });

  const userDatabase = {
    teacher: { email: 'teacher@rebot.ph', username: 'teacher123', password: 'teacher123', fullName: 'Maria Santos' },
    canteen: { email: 'canteen@rebot.ph', username: 'canteen123', password: 'canteen123', fullName: 'Rosa Mercado' },
    junk: { email: 'junk@rebot.ph', username: 'junk123', password: 'junk123', fullName: 'Juan Reyes' },
    utility: { email: 'utility@rebot.ph', username: 'utility123', password: 'utility123', fullName: 'Utility Staff' },
    admin: { email: 'admin@rebot.ph', username: 'admin123', password: 'admin123', fullName: 'Admin User' }
  };

  const roles = [
    { value: 'teacher', label: 'Teacher', icon: 'fas fa-chalkboard-user', desc: 'Class points and student records' },
    { value: 'canteen', label: 'Canteen', icon: 'fas fa-utensils', desc: 'Reward claiming and inventory' },
    { value: 'junk', label: 'Junk Shop', icon: 'fas fa-recycle', desc: 'Pickup and recyclable records' },
    { value: 'utility', label: 'Utility', icon: 'fas fa-tools', desc: 'Bin status and maintenance' },
    { value: 'admin', label: 'Admin', icon: 'fas fa-user-shield', desc: 'Full system management' }
  ];

  // ========== useEffect HOOKS ==========
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.setAttribute('data-landing', 'true');
    
    // Simulate loading to show loading screen
    setTimeout(() => {
      setPageLoading(false);
    }, 500);
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('rebot_user');
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const roleMap = {
          'administrator': '/admin',
          'teacher': '/teacher',
          'canteen_staff': '/canteen',
          'junk_shop_personnel': '/junk',
          'student': '/student'
        };
        const redirectPath = roleMap[userData.role] || '/';
        window.location.href = redirectPath;
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    return () => document.body.removeAttribute('data-landing');
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // ========== FUNCTIONS ==========
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
      color = '#dc2626';
    } else if (strength <= 4) {
      text = 'Medium password';
      color = '#f59e0b';
    } else {
      text = 'Strong password';
      color = '#16a34a';
    }

    setPasswordStrength({
      strength,
      text,
      color,
      guidelines: { length: hasLength, lowercase: hasLower, uppercase: hasUpper, number: hasNumber, special: hasSpecial }
    });

    return strength;
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    checkPasswordStrength(e.target.value);
  };

  const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
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
          'administrator': '/admin',
          'teacher': '/teacher',
          'canteen_staff': '/canteen',
          'junk_shop_personnel': '/junk',
          'student': '/student'
        };
        
        const redirectPath = roleMap[data.user.role] || '/';
        window.location.href = redirectPath;
        
      } else {
        setLoginError(data.message || 'Login failed');
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please make sure the backend server is running on port 5000');
      toast.error('Network error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const quickFillCredentials = (role) => {
    const creds = userDatabase[role];
    if (!creds) return;
    setSelectedRole(role);
    setLoginUsername(creds.username);
    setLoginPassword(creds.password);
    setLoginError('');
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

    if (code.length !== 6) return setResetError('Please enter the complete 6-digit verification code.');
    if (code !== generatedCode) return setResetError('Invalid verification code.');
    if (newPassword.length < 6) return setResetError('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setResetError('Passwords do not match.');

    toast.success('Password reset successfully!');
    setForgotModalOpen(false);
    setGeneratedCode('');
    resetForgotPasswordState();
    setLoginModalOpen(true);
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value.replace(/\D/g, '');
    setVerificationCode(newCode);

    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) newCode[i] = digits[i];
    setVerificationCode(newCode);
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
  };

  const handleModalClose = (setter) => (e) => {
    if (e.target !== e.currentTarget) return;
    setter(false);
    if (setter === setLoginModalOpen) {
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    }
    if (setter === setForgotModalOpen) resetForgotPasswordState();
  };

  const selectedRoleInfo = roles.find((role) => role.value === selectedRole);

  // ========== CONDITIONAL RETURN AT THE VERY END ==========
  if (pageLoading) {
    return <LoadingScreen message="Welcome to ReBot..." />;
  }

  // ========== REST OF YOUR JSX RETURN ==========
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7fbf7] font-sans text-slate-800">
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 shadow-lg shadow-green-900/5 backdrop-blur-xl' : 'bg-white/70 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-xl text-white shadow-lg shadow-green-600/20">♻️</div>
            <div className="text-left">
              <div className="text-2xl font-black tracking-tight text-green-900">ReBot</div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600">Patubig ES</div>
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#home" className="nav-link">Home</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#about" className="nav-link">About</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setLoginModalOpen(true)} className="btn-secondary">
              <i className="fas fa-right-to-bracket"></i>
              <span className="hidden sm:inline">Login</span>
            </button>
            <button onClick={() => toast.success('Please contact your school administrator to create an account.')} className="btn-primary hidden sm:inline-flex">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section id="home" className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_30%)]"></div>
        <div className="absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-green-200/50 blur-3xl"></div>
        <div className="absolute bottom-0 right-[-10rem] h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"></div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-sm font-black text-green-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Smart Recycling Monitoring System
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              ReBot makes recycling
              <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500 bg-clip-text text-transparent">rewarding for students.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A modern school-based recycling system for QR student identification, bottle validation, points monitoring, reward redemption, and staff dashboards.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setLoginModalOpen(true)} className="btn-primary h-14 px-7 text-base">
                <i className="fas fa-gauge-high"></i>
                Open Dashboard
              </button>
              <a href="#how-it-works" className="btn-secondary h-14 px-7 text-base">
                <i className="fas fa-circle-play"></i>
                View Process
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="glass-card p-5">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-green-100 text-green-700">
                  <i className="fas fa-qrcode"></i>
                </div>
                <h3 className="font-black text-green-950">QR-Based Identification</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Students can be identified through QR scanning before earning or redeeming points.</p>
              </div>

              <div className="glass-card p-5">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-green-100 text-green-700">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3 className="font-black text-green-950">Role-Based Monitoring</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Teachers, canteen staff, utility staff, junk shop personnel, and admins have their own dashboard views.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">Simple Process</div>
            <h2 className="text-4xl font-black text-green-950">How ReBot Works</h2>
            <p className="mt-3 text-slate-500">A simple QR-based recycling flow for students, teachers, and school staff.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              ['Scan QR', 'Students scan their QR code to identify their account.', 'fas fa-qrcode'],
              ['Insert Bottle', 'The machine detects and validates recyclable bottles.', 'fas fa-recycle'],
              ['Earn Points', 'Accepted bottles are converted into student points.', 'fas fa-star'],
              ['Redeem Rewards', 'Students can claim biscuits, school supplies, or save points.', 'fas fa-gift']
            ].map(([title, desc, icon], index) => (
              <div key={title} className="relative rounded-[2rem] border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-green-900/5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-green-600 text-2xl text-white shadow-lg shadow-green-600/20">
                    <i className={icon}></i>
                  </div>
                  <div className="text-5xl font-black text-green-100">0{index + 1}</div>
                </div>
                <h3 className="text-xl font-black text-green-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-950 via-emerald-900 to-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-green-100 ring-1 ring-white/15">
              Role-Based Monitoring
            </div>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">One system for every school operation.</h2>
            <p className="mt-5 max-w-xl leading-8 text-white/70">
              Teachers, canteen staff, utility personnel, junk shop partners, and admins can access dashboards designed for their responsibilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <div key={role.value} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/15">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-green-950">
                  <i className={role.icon}></i>
                </div>
                <h3 className="font-black">{role.label}</h3>
                <p className="mt-1 text-sm leading-6 text-white/65">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="about" className="bg-slate-950 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-600 text-xl">♻️</div>
              <div>
                <div className="text-2xl font-black">ReBot</div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-green-400">Patubig Elementary School</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-400">Smart recycling for smarter schools. ReBot encourages students to recycle while helping the school monitor rewards, points, and donations.</p>
          </div>

          <div>
            <h4 className="mb-4 font-black text-amber-300">Quick Links</h4>
            <a href="#home" className="footer-link">Home</a>
            <a href="#how-it-works" className="footer-link">How it Works</a>
          </div>

          <div>
            <h4 className="mb-4 font-black text-amber-300">Contact</h4>
            <button onClick={() => copyToClipboard('patubig.es@rebot.ph', 'Email copied!')} className="footer-link text-left"><i className="fas fa-envelope mr-2"></i>patubig.es@rebot.ph</button>
            <button onClick={() => copyToClipboard('(044) 123 4567', 'Phone copied!')} className="footer-link text-left"><i className="fas fa-phone mr-2"></i>(044) 123 4567</button>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © 2026 ReBot - Patubig Elementary School Recycling Reward System.
        </div>
      </footer>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="modal-backdrop" onClick={handleModalClose(setLoginModalOpen)}>
          <div className="grid max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl animate-modalUp lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-green-950 to-emerald-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-green-400/20 blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl"></div>

              <div className="relative z-10">
                <div className="mb-10 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-lime-300 text-green-950">♻️</span>
                  <span className="text-sm font-black">ReBot Access Portal</span>
                </div>

                <h2 className="max-w-sm text-5xl font-black leading-tight tracking-tight">
                  Manage recycling with a smarter dashboard.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
                  Access the tools you need based on your role: student records, reward claiming, pickup records, bin monitoring, and system management.
                </p>
              </div>

              <div className="relative z-10 grid gap-4">
                <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-green-950">
                      <i className="fas fa-user-shield"></i>
                    </div>
                    <div>
                      <p className="font-black">Secure Role Login</p>
                      <p className="text-xs text-white/60">Only authorized users can access dashboard modules.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lime-300">
                      <i className="fas fa-layer-group"></i>
                    </div>
                    <div>
                      <p className="font-black">Clean System Access</p>
                      <p className="text-xs text-white/60">Designed for teachers, canteen, utility, junk shop, and admin users.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 lg:p-10">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Secure Login
                  </div>
                  <h3 className="text-4xl font-black tracking-tight text-green-950">Welcome back</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Select your role below. Demo credentials will be filled automatically.</p>
                </div>
                <button onClick={() => setLoginModalOpen(false)} className="icon-close"><i className="fas fa-times"></i></button>
              </div>

              <div className="mb-6 rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-600 text-white">
                    <i className={selectedRoleInfo?.icon}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-green-950">Current Role: {selectedRoleInfo?.label}</p>
                    <p className="text-xs font-semibold leading-5 text-slate-500">{selectedRoleInfo?.desc}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {roles.map((role) => (
                  <button key={role.value} type="button" onClick={() => quickFillCredentials(role.value)} className={`rounded-3xl border-2 p-4 text-center transition ${selectedRole === role.value ? 'border-green-600 bg-green-50 shadow-lg shadow-green-900/5' : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/50'}`}>
                    <div className={`mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl ${selectedRole === role.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <i className={role.icon}></i>
                    </div>
                    <p className="font-black text-slate-800">{role.label}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="form-label">Username / ID</label>
                  <div className="field-wrap">
                    <i className="fas fa-user field-icon"></i>
                    <input 
                      value={loginUsername} 
                      onChange={(e) => setLoginUsername(e.target.value)} 
                      className="input pl-12" 
                      placeholder="Enter your username" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="field-wrap">
                    <i className="fas fa-lock field-icon"></i>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      className="input pl-12 pr-14" 
                      placeholder="Enter your password" 
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                    Role: <span className="text-green-700">{selectedRoleInfo?.label}</span>
                  </div>
                  <button type="button" onClick={() => { setLoginModalOpen(false); setForgotModalOpen(true); setResetError(''); setResetSuccess(''); }} className="text-sm font-bold text-green-700 hover:underline">
                    <i className="fas fa-key mr-2"></i>Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={isLoggingIn} className="btn-primary h-14 w-full text-base disabled:opacity-70">
                  {isLoggingIn ? <><i className="fas fa-spinner fa-spin"></i>Logging in...</> : <><i className="fas fa-arrow-right-to-bracket"></i>Login to Dashboard</>}
                </button>

                {loginError && <Alert type="error" message={loginError} />}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="modal-backdrop" onClick={handleModalClose(setForgotModalOpen)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl animate-modalUp">
            <div className="relative overflow-hidden bg-gradient-to-r from-green-700 to-emerald-800 p-6 text-white sm:p-8">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Account Recovery</p>
                  <h3 className="mt-2 text-3xl font-black">Reset Password</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">Use your registered email and a 6-digit verification code.</p>
                </div>
                <button onClick={() => { setForgotModalOpen(false); resetForgotPasswordState(); }} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 text-white/80 hover:bg-white/10">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <StepBadge active icon="fas fa-envelope" title="Step 1" text="Email" />
                <div className="h-1 w-14 rounded-full bg-slate-200 sm:w-24"><div className={`h-full rounded-full bg-green-600 transition-all ${resetStep === 2 ? 'w-full' : 'w-1/2'}`}></div></div>
                <StepBadge active={resetStep === 2} icon="fas fa-key" title="Step 2" text="Code" right />
              </div>

              {resetStep === 1 && (
                <form onSubmit={handleSendVerification} className="space-y-5">
                  <Alert type="info" message="Enter your registered email and choose the correct role to receive a demo verification code." />

                  <div>
                    <label className="form-label">Registered Email</label>
                    <div className="field-wrap"><i className="fas fa-envelope field-icon"></i><input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="input pl-12" placeholder="Enter your registered email" required /></div>
                  </div>

                  <div>
                    <label className="form-label">Select Role</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {roles.map((role) => (
                        <button key={role.value} type="button" onClick={() => setResetRole(role.value)} className={`rounded-2xl border-2 p-3 text-left transition ${resetRole === role.value ? 'border-green-600 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}>
                          <i className={`${role.icon} mb-2 ${resetRole === role.value ? 'text-green-700' : 'text-slate-400'}`}></i>
                          <p className="text-sm font-black text-slate-700">{role.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={isSendingCode} className="btn-primary h-14 w-full text-base disabled:opacity-70">
                    {isSendingCode ? <><i className="fas fa-spinner fa-spin"></i>Sending...</> : <><i className="fas fa-paper-plane"></i>Send Verification Code</>}
                  </button>
                  {resetError && <Alert type="error" message={resetError} />}
                  {resetSuccess && <Alert type="success" message={resetSuccess} />}
                  <button type="button" onClick={() => { setForgotModalOpen(false); setLoginModalOpen(true); resetForgotPasswordState(); }} className="mx-auto flex items-center gap-2 text-sm font-bold text-green-700 hover:underline">
                    <i className="fas fa-arrow-left"></i>Back to Login
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <Alert type="info" message={`Please enter the 6-digit code sent to ${resetEmail}.`} />

                  <div>
                    <label className="form-label">Verification Code</label>
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOTPPaste}>
                      {verificationCode.map((digit, idx) => (
                        <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength="1" value={digit} onChange={(e) => handleOTPChange(idx, e.target.value)} onKeyDown={(e) => handleOTPKeyDown(idx, e)} className="h-14 w-11 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-black text-slate-800 outline-none transition focus:border-green-600 focus:bg-white sm:h-16 sm:w-14 sm:text-2xl" />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 sm:text-sm">
                      <span><i className="fas fa-clock mr-2"></i>{canResend ? 'You can resend now.' : `Resend available in ${timer}s`}</span>
                      {canResend && <button type="button" onClick={handleResendCode} className="font-bold text-green-700 hover:underline">Resend code</button>}
                    </div>
                  </div>

                  <PasswordInput label="New Password" value={newPassword} onChange={handleNewPasswordChange} show={showNewPassword} setShow={setShowNewPassword} placeholder="Enter a new password" />

                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full transition-all" style={{ width: `${(passwordStrength.strength / 5) * 100}%`, backgroundColor: passwordStrength.color || '#e5e7eb' }}></div></div>
                    <p className="mt-2 text-xs font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.text}</p>
                    <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                      {[
                        ['length', 'At least 6 characters'],
                        ['lowercase', 'Lowercase letter'],
                        ['uppercase', 'Uppercase letter'],
                        ['number', 'Number'],
                        ['special', 'Special character']
                      ].map(([key, text]) => (
                        <span key={key} className={`text-xs font-semibold ${passwordStrength.guidelines[key] ? 'text-green-700' : 'text-slate-500'}`}>
                          <i className={`fas mr-2 ${passwordStrength.guidelines[key] ? 'fa-circle-check' : 'fa-circle'}`}></i>{text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={showConfirmPassword} setShow={setShowConfirmPassword} placeholder="Re-enter your password" icon="fas fa-check-circle" />

                  <button type="submit" className="btn-primary h-14 w-full text-base"><i className="fas fa-shield-heart"></i>Reset Password</button>
                  {resetError && <Alert type="error" message={resetError} />}
                  <button type="button" onClick={() => { setResetStep(1); setVerificationCode(['', '', '', '', '', '']); setNewPassword(''); setConfirmPassword(''); setResetError(''); setResetSuccess(''); }} className="mx-auto flex items-center gap-2 text-sm font-bold text-green-700 hover:underline"><i className="fas fa-arrow-left"></i>Back to verification</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-link { font-size: 0.9rem; font-weight: 800; color: #475569; transition: color .2s ease; }
        .nav-link:hover { color: #15803d; }
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; border-radius: 9999px; background: linear-gradient(135deg, #16a34a, #047857); color: white; font-weight: 900; box-shadow: 0 18px 35px rgba(22, 163, 74, .22); transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(.98); box-shadow: 0 22px 42px rgba(22, 163, 74, .28); }
        .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; border-radius: 9999px; border: 2px solid #bbf7d0; background: rgba(255,255,255,.85); color: #166534; font-weight: 900; transition: all .2s ease; }
        .btn-secondary:hover { border-color: #22c55e; background: #f0fdf4; transform: translateY(-1px); }
        .card { border-radius: 2rem; border: 1px solid #dcfce7; background: rgba(255,255,255,.88); padding: 1.5rem; box-shadow: 0 18px 40px rgba(20,83,45,.06); transition: all .25s ease; }
        .glass-card { border-radius: 1.5rem; border: 1px solid rgba(255,255,255,.9); background: rgba(255,255,255,.78); box-shadow: 0 18px 40px rgba(20,83,45,.07); backdrop-filter: blur(14px); }
        .dashboard-mini-card { border-radius: 1.5rem; background: rgba(255,255,255,.1); padding: 1rem; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
        .card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px rgba(20,83,45,.1); }
        .input { height: 3.5rem; width: 100%; border-radius: 1rem; border: 2px solid #e2e8f0; background: rgba(248,250,252,.8); padding-left: 1rem; padding-right: 1rem; font-weight: 700; color: #334155; outline: none; transition: all .2s ease; }
        .input::placeholder { color: #94a3b8; font-weight: 600; }
        .input:focus { border-color: #16a34a; background: white; box-shadow: 0 0 0 4px rgba(34,197,94,.1); }
        .form-label { margin-bottom: .5rem; display: block; font-size: .875rem; font-weight: 900; color: #334155; }
        .field-wrap { position: relative; }
        .field-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; z-index: 2; pointer-events: none; }
        .field-wrap .input { padding-left: 3.25rem !important; }
        .field-wrap .input.pr-14 { padding-right: 3.75rem !important; }
        .password-toggle { position: absolute; right: .55rem; top: 50%; transform: translateY(-50%); display: grid; height: 2.35rem; width: 2.35rem; place-items: center; border-radius: .85rem; color: #64748b; transition: all .2s ease; }
        .password-toggle:hover { background: #f1f5f9; color: #0f172a; }
        .icon-close { display: grid; height: 2.75rem; width: 2.75rem; place-items: center; border-radius: 1rem; border: 1px solid #e2e8f0; color: #64748b; transition: all .2s ease; }
        .icon-close:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .footer-link { margin-bottom: .65rem; display: block; font-size: .875rem; font-weight: 700; color: #94a3b8; transition: color .2s ease; }
        .footer-link:hover { color: #fbbf24; }
        .modal-backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(2,6,23,.68); padding: 1rem; backdrop-filter: blur(10px); }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes modalUp { from { opacity: 0; transform: translateY(20px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-modalUp { animation: modalUp .26s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fa-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Helper Components
function Alert({ type = 'info', message }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700 fas fa-circle-exclamation',
    success: 'border-green-200 bg-green-50 text-green-700 fas fa-circle-check',
    info: 'border-emerald-200 bg-emerald-50 text-emerald-700 fas fa-circle-info'
  };
  const [box, icon] = styles[type].split(' fas ');

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${box}`}>
      <i className={`fas ${icon} mt-0.5`}></i>
      <span>{message}</span>
    </div>
  );
}

function StepBadge({ active, icon, title, text, right }) {
  return (
    <div className={`flex items-center gap-3 ${right ? 'justify-end text-right' : ''}`}>
      {!right && <div className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}><i className={icon}></i></div>}
      <div>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="text-xs font-semibold text-slate-500">{text}</p>
      </div>
      {right && <div className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}><i className={icon}></i></div>}
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, setShow, placeholder, icon = 'fas fa-lock' }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="field-wrap">
        <i className={`${icon} field-icon`}></i>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} className="input pl-12 pr-14" placeholder={placeholder} required />
        <button type="button" onClick={() => setShow(!show)} className="password-toggle">
          <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
    </div>
  );
}