import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Menu,
  X,
  LogOut,
  User,
  Settings as SettingsIcon,
  LayoutDashboard,
  Users,
  Gift,
  Package,
  BarChart3,
  Moon,
  Sun,
  QrCode,
  ShoppingBag,
  GraduationCap,
  Coffee,
  Shield,
  ChevronLeft,
  ChevronRight,
  Award,
  Calendar,
  BookOpen,
  AlertTriangle,
  Loader,
  Recycle
} from 'lucide-react';
import toast from 'react-hot-toast';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-scaleUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <LogOut size={24} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Logout Confirmation</h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-2">Are you sure you want to logout?</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">You will need to login again to access your account.</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={18} />
                Yes, Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userAvatar, setUserAvatar] = useState(user?.avatar || null);
  const [currentUser, setCurrentUser] = useState(user);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
    setUserAvatar(user?.avatar || null);
  }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      const newAvatarUrl = event.detail?.avatarUrl;
      setUserAvatar(newAvatarUrl);

      const userStr = localStorage.getItem('rebot_user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.avatar = newAvatarUrl;
        localStorage.setItem('rebot_user', JSON.stringify(userData));
      }

      if (currentUser) {
        setCurrentUser({ ...currentUser, avatar: newAvatarUrl });
      }

      const avatarElements = document.querySelectorAll('.user-avatar-image');
      avatarElements.forEach(img => {
        if (img.src !== newAvatarUrl) {
          img.src = newAvatarUrl;
        }
      });
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [currentUser]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getNavItems = () => {
    const role = currentUser?.role;

    const navItems = {
      administrator: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'User Management', path: '/admin/users', icon: Users, color: 'text-green-400' },
        { name: 'Section Management', path: '/admin/sections', icon: BookOpen, color: 'text-indigo-400' },
        { name: 'Rewards', path: '/admin/rewards', icon: Gift, color: 'text-yellow-400' },
        { name: 'Reports', path: '/admin/reports', icon: BarChart3, color: 'text-purple-400' },
        { name: 'Inventory', path: '/admin/inventory', icon: Package, color: 'text-orange-400' },
        { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      teacher: [
        { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'Students', path: '/teacher/students', icon: GraduationCap, color: 'text-green-400' },
        { name: 'Settings', path: '/teacher/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      canteen_staff: [
        { name: 'Dashboard', path: '/canteen', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'Scan & Redeem', path: '/canteen/scan', icon: QrCode, color: 'text-green-400' },
        { name: 'History', path: '/canteen/history', icon: ShoppingBag, color: 'text-purple-400' },
        { name: 'Rewards', path: '/canteen/rewards', icon: Gift, color: 'text-yellow-400' },
        { name: 'Settings', path: '/canteen/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      student: [
        { name: 'Dashboard', path: '/student', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'My Points', path: '/student/points', icon: Award, color: 'text-yellow-400' },
        { name: 'History', path: '/student/history', icon: ShoppingBag, color: 'text-purple-400' },
        { name: 'Settings', path: '/student/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
    };

    return navItems[role] || navItems.student;
  };

  const getRoleDisplayName = () => {
    const role = currentUser?.role;
    const names = {
      administrator: 'Administrator',
      teacher: 'Teacher',
      canteen_staff: 'Canteen Staff',
      student: 'Student',
    };
    return names[role] || 'User';
  };

  const navItems = getNavItems();
  const currentPath = location.pathname;
  const activeNavItem = navItems
    .filter((item) => currentPath === item.path || currentPath.startsWith(`${item.path}/`))
    .reduce((activeItem, item) => (
      !activeItem || item.path.length > activeItem.path.length ? item : activeItem
    ), null);

  const getPageTitle = () => {
    return activeNavItem?.name || 'Dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`p-5 border-b border-gray-200 dark:border-gray-700 ${sidebarCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Recycle size={21} className="text-primary-700 dark:text-primary-300" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-lg font-bold tracking-wide">ReBot</h1>
              <p className="text-xs text-white/60">Patubig Elementary</p>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${sidebarCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={currentUser?.fullName || 'User'}
                  className="w-full h-full object-cover user-avatar-image"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-gray-700 dark:text-gray-200 text-lg font-bold">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">{currentUser?.fullName || 'User'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentUser?.isActive !== false ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getRoleDisplayName()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeNavItem?.path === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
                  ${sidebarCollapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                  }
                `}
                title={sidebarCollapsed ? item.name : ''}
              >
                <item.icon size={19} className={isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'} />
                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">{item.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${sidebarCollapsed ? 'px-2' : ''}`}>
        <div className="space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && (
              <span className="font-medium text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
          <button
            onClick={handleLogoutClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-300
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && (
              <span className="font-medium text-sm">Logout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100
          border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out
          md:translate-x-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-72'} w-72
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-gray-950/30 md:hidden"
        />
      )}

      <button
        onClick={toggleSidebar}
        className="fixed top-20 z-50 hidden p-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 md:block"
        style={{ left: sidebarCollapsed ? '70px' : '288px' }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <main className={`transition-all duration-200 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 lg:px-6 lg:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
                >
                  <Menu size={18} />
                </button>
                <div>
                <h1 className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {getPageTitle()}
                </h1>
                <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Calendar size={12} />
                  <span>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar size={12} />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}