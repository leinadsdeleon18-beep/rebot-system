import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Award, Gift, Recycle, TrendingUp } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import { DashboardEmpty, DashboardHeader, DashboardMetrics, DashboardPanel, DashboardRefresh } from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import Timestamps from './pages/Timestamps';
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
const StudentDashboard = ({ view = 'overview' }) => {
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

  const schoolClass = [student?.grade, student?.section].filter(Boolean).join(' · ');
  const title = { points: 'My points', history: 'Recycling history' }[view] || 'Welcome, ' + (student?.fullName || user?.fullName || 'student');

  return (
    <div className="rb-dashboard">
      <DashboardHeader title={title} description={schoolClass || 'Your recycling points, activity, and rewards.'}>
        <DashboardRefresh busy={loading} onClick={() => setRefreshKey(current => current + 1)} />
      </DashboardHeader>

      {error && <p className="rb-dash-notice" role="alert">{error}</p>}
      {loading && !student && <p className="rb-dash-notice" role="status">Loading your recycling activity…</p>}
      {student && (
        <>
          {view !== 'history' && <DashboardMetrics label="Your recycling totals" items={[
            { label: 'Points balance', value: student.points, icon: Award, primary: true },
            { label: 'Bottles recycled', value: student.totalBottlesRecycled, icon: Recycle },
            { label: 'Lifetime points earned', value: student.totalPointsEarned, icon: TrendingUp }
          ]} />}
          <div className={view === 'overview' ? 'rb-dash-split rb-dash-even' : undefined}>
            {view !== 'history' && <DashboardPanel title="Reward progress" description="Rewards you can claim at the canteen">
              {availableRewards.length ? (
                <ul className="rb-dash-list">
                  {availableRewards.map(reward => {
                    const required = Number(reward.pointsRequired) || 0;
                    const stock = Number(reward.stock ?? reward.stockQuantity) || 0;
                    const progress = required > 0 ? Math.max(0, Math.min(100, (student.points / required) * 100)) : 100;
                    const ready = stock > 0 && student.points >= required;
                    const status = stock <= 0
                      ? 'Out of stock'
                      : ready ? 'Ready to claim' : numberFormat.format(required - student.points) + ' points to go';
                    return (
                      <li key={reward._id} className="rb-dash-panel-body">
                        <div className="rb-dash-reward-name">
                          <span><Gift className="rb-dash-row-icon" size={18} aria-hidden="true" /> <strong>{reward.name}</strong></span>
                          <span>{numberFormat.format(required)} pts</span>
                        </div>
                        <div className="rb-dash-track" role="progressbar" aria-label={reward.name + ' points progress'} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                          <div style={{ width: progress + '%' }} />
                        </div>
                        <p className={'rb-dash-goal-note ' + (ready ? 'rb-dash-positive' : '')}>{status}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <DashboardEmpty icon={Gift} title={rewardsError ? 'Rewards unavailable' : 'No rewards available'}>{rewardsError}</DashboardEmpty>
              )}
            </DashboardPanel>}

            {view !== 'points' && <DashboardPanel title="Recent activity" description="Recycling deposits and reward claims">
              {transactions.length ? (
                <ul className="rb-dash-list">
                  {transactions.map(transaction => {
                    const redeemed = transaction.type === 'redeem' || transaction.pointsSpent > 0;
                    const amount = redeemed ? transaction.pointsSpent : transaction.pointsEarned;
                    const title = redeemed
                      ? transaction.rewardName || 'Reward claimed'
                      : transaction.description || 'Recycling points earned';
                    return (
                      <li key={transaction.id} className="rb-dash-row">
                        <div>
                          <strong>{title}</strong>
                          <small>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Date unavailable'}</small>
                        </div>
                        <strong className={redeemed ? 'rb-dash-negative' : 'rb-dash-positive'}>{redeemed ? '−' : '+'}{numberFormat.format(amount || 0)} pts</strong>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <DashboardEmpty icon={Recycle} title="No activity yet">Your recycling deposits and reward claims will appear here.</DashboardEmpty>
              )}
            </DashboardPanel>}
          </div>
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
          <Route path="timestamps" element={<Timestamps />} />
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
          <Route path="timestamps" element={<Timestamps />} />
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
          <Route path="timestamps" element={<Timestamps />} />
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
          <Route path="points" element={<StudentDashboard view="points" />} />
          <Route path="history" element={<StudentDashboard view="history" />} />
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