import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Award, Gift, Recycle, RefreshCw, TrendingUp } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import { rewardsAPI, studentsAPI } from './services/apiService';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SectionManagement from './pages/admin/SectionManagement';
import RewardsManagement from './pages/admin/RewardsManagement';
import Reports from './pages/admin/Reports';
import InventoryManagement from './pages/admin/InventoryManagement';
import AdminSettings from './pages/admin/Settings';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import TeacherSettings from './pages/teacher/Settings';

// Canteen Pages
import CanteenDashboard from './pages/canteen/CanteenDashboard';
import RedemptionScanner from './pages/canteen/RedemptionScanner';
import TransactionHistory from './pages/canteen/TransactionHistory';
import AvailableRewards from './pages/canteen/AvailableRewards';
import CanteenSettings from './pages/canteen/Settings';

// Student Pages
const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [rewardsError, setRewardsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      setRewardsError('');
      const [dashboardResult, rewardsResult] = await Promise.allSettled([
        studentsAPI.getMyDashboard(),
        rewardsAPI.getAll()
      ]);

      if (cancelled) return;

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value.data);
      } else {
        const requestError = dashboardResult.reason;
        setDashboard(null);
        setError(requestError.response?.status === 404
            ? 'Your login is not linked to a student record. Ask school staff to check your student email.'
            : requestError.response?.data?.message || 'Unable to load your dashboard. Please try again.');
      }

      if (rewardsResult.status === 'fulfilled') {
        setRewards(rewardsResult.value.data?.rewards || []);
      } else {
        setRewards([]);
        setRewardsError('Rewards could not be loaded right now.');
      }
      setLoading(false);
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const student = dashboard?.student;
  const transactions = dashboard?.transactions || [];
  const availableRewards = rewards
    .filter((reward) => reward.isActive !== false)
    .sort((first, second) => (first.pointsRequired || 0) - (second.pointsRequired || 0))
    .slice(0, 6);
  const numberFormat = new Intl.NumberFormat();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">STUDENT OVERVIEW</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {student?.fullName || user?.fullName || 'Student'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your recycling points and latest activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
          className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}

      {student && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Student recycling totals">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">Points balance</p>
                <Award size={20} className="text-green-700 dark:text-green-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-green-950 dark:text-white">
                {loading ? '...' : numberFormat.format(student.points)}
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-900/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Bottles recycled</p>
                <Recycle size={20} className="text-orange-700 dark:text-orange-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-orange-950 dark:text-white">
                {loading ? '...' : numberFormat.format(student.totalBottlesRecycled)}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Points earned</p>
                <TrendingUp size={20} className="text-blue-700 dark:text-blue-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-blue-950 dark:text-white">
                {loading ? '...' : numberFormat.format(student.totalPointsEarned)}
              </p>
            </div>
          </section>

          <section className="space-y-3" aria-label="Reward progress">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Rewards to work toward</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your points progress toward available rewards.</p>
            </div>
            {availableRewards.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {availableRewards.map((reward) => {
                  const pointsRequired = Number(reward.pointsRequired) || 0;
                  const stock = Number(reward.stock ?? reward.stockQuantity) || 0;
                  const progress = pointsRequired > 0
                    ? Math.min((student.points / pointsRequired) * 100, 100)
                    : 0;
                  const status = stock <= 0
                    ? 'Out of stock'
                    : student.points >= pointsRequired
                      ? 'Ready to claim at the canteen'
                      : `${numberFormat.format(pointsRequired - student.points)} points to go`;

                  return (
                    <article key={reward._id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Gift size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{reward.name}</h3>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {numberFormat.format(pointsRequired)} pts
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="progressbar" aria-label={`${reward.name} points progress`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-green-500 transition-[width]" style={{ width: `${progress}%` }} />
                      </div>
                      <p className={`mt-2 text-xs ${stock <= 0 ? 'text-gray-500 dark:text-gray-400' : student.points >= pointsRequired ? 'font-medium text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {status}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                {rewardsError || 'No rewards are available right now.'}
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent activity</h2>
              {(student.grade || student.section) && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {[student.grade, student.section].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {transactions.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.map((transaction) => {
                  const redeemed = transaction.type === 'redeem' || transaction.pointsSpent > 0;
                  const amount = redeemed ? transaction.pointsSpent : transaction.pointsEarned;
                  const title = redeemed
                    ? transaction.rewardName || 'Reward claimed'
                    : transaction.description || 'Recycling points earned';
                  return (
                    <li key={transaction.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${redeemed ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                          {redeemed ? <Gift size={17} /> : <Recycle size={17} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Date unavailable'}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${redeemed ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
                        {redeemed ? '-' : '+'}{numberFormat.format(amount || 0)} pts
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading activity...' : 'No recycling or reward activity yet.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const StudentSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const studentData = {
    fullName: user?.fullName || 'Student',
    email: user?.email || 'student@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'student',
    address: 'Patubig, Marilao, Bulacan',
    bio: 'Student at Patubig Elementary School'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const Settings = require('./components/settings').default;
  return <Settings userRole="student" userData={studentData} onLogout={handleLogout} />;
};

// ========== PROTECTED ROUTE COMPONENT ==========
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen message="Verifying your credentials..." />;
  }
  
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// ========== ROLE REDIRECT COMPONENT ==========
function RoleRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const roleMap = {
        'administrator': '/admin',
        'teacher': '/teacher',
        'canteen_staff': '/canteen',
        'student': '/student'
      };
      const redirectPath = roleMap[user.role] || '/';
      navigate(redirectPath, { replace: true });
    } else if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  return <LoadingScreen message="Redirecting to your dashboard..." />;
}

// ========== THEME HANDLER ==========
function ThemeHandler() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  useEffect(() => {
    if (isLandingPage) {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    } else {
      document.body.style.backgroundColor = '';
    }
  }, [isLandingPage]);
  
  return null;
}

// ========== MAIN APP CONTENT ==========
function AppContent() {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }
  
  return (
    <>
      <ThemeHandler />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Role Redirect (after login) */}
        <Route path="/dashboard" element={<RoleRedirect />} />
        
        {/* ========== ADMIN ROUTES ========== */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['administrator']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="rewards" element={<RewardsManagement />} />
          <Route path="sections" element={<SectionManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* ========== TEACHER ROUTES ========== */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>
        
        {/* ========== CANTEEN ROUTES ========== */}
        <Route path="/canteen" element={
          <ProtectedRoute allowedRoles={['canteen_staff']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CanteenDashboard />} />
          <Route path="scan" element={<RedemptionScanner />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="rewards" element={<AvailableRewards />} />
          <Route path="settings" element={<CanteenSettings />} />
        </Route>

        {/* ========== STUDENT ROUTES ========== */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// ========== MAIN APP ==========
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#2e7d32',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#d32f2f',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;