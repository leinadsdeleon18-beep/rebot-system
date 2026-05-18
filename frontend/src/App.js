import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './components/LoadingScreen';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RewardsManagement from './pages/admin/RewardsManagement';
import Reports from './pages/admin/Reports';
import InventoryManagement from './pages/admin/InventoryManagement';
import AdminSettings from './pages/admin/Settings';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QRManagement from './pages/teacher/QRManagement';
import TeacherSettings from './pages/teacher/Settings';

// Canteen Pages
import CanteenDashboard from './pages/canteen/CanteenDashboard';
import RedemptionScanner from './pages/canteen/RedemptionScanner';
import TransactionHistory from './pages/canteen/TransactionHistory';
import AvailableRewards from './pages/canteen/AvailableRewards';
import CanteenSettings from './pages/canteen/Settings';

// Junk Shop Pages
import JunkShopDashboard from './pages/junk/JunkShopDashboard';
import PickupScheduler from './pages/junk/PickupScheduler';
import CollectionHistory from './pages/junk/CollectionHistory';
import JunkSettings from './pages/junk/Settings';

// Student Pages
const StudentDashboard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Student Dashboard</h2>
    <p className="text-gray-500 dark:text-gray-400 mt-2">Track your recycling points and redeem rewards</p>
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">My Points</p>
        <p className="text-3xl font-bold text-green-600">0</p>
      </div>
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Bottles Recycled</p>
        <p className="text-3xl font-bold text-orange-600">0</p>
      </div>
    </div>
  </div>
);

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
        'junk_shop_personnel': '/junk',
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
          <Route path="qr-codes" element={<QRManagement />} />
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
        
        {/* ========== JUNK SHOP ROUTES ========== */}
        <Route path="/junk" element={
          <ProtectedRoute allowedRoles={['junk_shop_personnel']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<JunkShopDashboard />} />
          <Route path="pickups" element={<PickupScheduler />} />
          <Route path="history" element={<CollectionHistory />} />
          <Route path="settings" element={<JunkSettings />} />
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