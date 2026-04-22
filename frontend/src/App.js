import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RewardsManagement from './pages/admin/RewardsManagement';
import DonationsManagement from './pages/admin/DonationsManagement';
import Reports from './pages/admin/Reports';
import InventoryManagement from './pages/admin/InventoryManagement';
import AdminSettings from './pages/admin/Settings';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QRManagement from './pages/teacher/QRManagement';
import TeacherRewards from './pages/teacher/TeacherRewards';

// Canteen Pages
import CanteenDashboard from './pages/canteen/CanteenDashboard';
import RedemptionScanner from './pages/canteen/RedemptionScanner';
import TransactionHistory from './pages/canteen/TransactionHistory';
import AvailableRewards from './pages/canteen/AvailableRewards';

// Junk Shop Pages
import JunkShopDashboard from './pages/junk/JunkShopDashboard';
import PickupScheduler from './pages/junk/PickupScheduler';
import CollectionHistory from './pages/junk/CollectionHistory';

// Student Pages (Coming Soon)
const StudentDashboard = () => <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Student Dashboard</h2><p className="text-gray-500 dark:text-gray-400 mt-2">Coming soon...</p></div>;

// Component to handle theme based on route
function ThemeHandler() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/login';
  
  useEffect(() => {
    if (isLandingPage) {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    } else {
      document.body.style.backgroundColor = '';
    }
  }, [isLandingPage, location.pathname]);
  
  return null;
}

function AppContent() {
  const { user, loading } = useAuth();

  const PrivateRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={`/${user.role}`} />;
    }
    
    return children;
  };

  return (
    <>
      <ThemeHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="rewards" element={<RewardsManagement />} />
          <Route path="donations" element={<DonationsManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <PrivateRoute allowedRoles={['teacher']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="qr-codes" element={<QRManagement />} />
          <Route path="rewards" element={<TeacherRewards />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Canteen Routes */}
        <Route path="/canteen" element={
          <PrivateRoute allowedRoles={['canteen']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<CanteenDashboard />} />
          <Route path="scan" element={<RedemptionScanner />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="rewards" element={<AvailableRewards />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Junk Shop Routes */}
        <Route path="/junk" element={
          <PrivateRoute allowedRoles={['junk']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<JunkShopDashboard />} />
          <Route path="status" element={<JunkShopDashboard />} />
          <Route path="pickups" element={<PickupScheduler />} />
          <Route path="history" element={<CollectionHistory />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Student Routes */}
        <Route path="/student" element={
          <PrivateRoute allowedRoles={['student']}>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;