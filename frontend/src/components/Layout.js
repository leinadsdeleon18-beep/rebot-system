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
  Truck,
  GraduationCap,
  Coffee,
  Recycle,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Award,
  FileText,
  Bell,
  HelpCircle,
  Menu as MenuIcon,
  UserCheck,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(user?.avatar || null);
  const [currentUser, setCurrentUser] = useState(user);

  // Add this state
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Add this effect to handle page transitions
  useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => setIsPageLoading(false);

    // You can add navigation events here if using react-router
    return () => {
      handleComplete();
    };
  }, [location.pathname]);
  // Check if screen is mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Update local state when user changes
  useEffect(() => {
    setCurrentUser(user);
    setUserAvatar(user?.avatar || null);
  }, [user]);

  // Listen for avatar updates from Settings component
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      const newAvatarUrl = event.detail?.avatarUrl;
      console.log('Avatar update received in Layout:', newAvatarUrl);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getNavItems = () => {
    const role = currentUser?.role;

    const navItems = {
      administrator: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'User Management', path: '/admin/users', icon: Users, color: 'text-green-400' },
        { name: 'Rewards', path: '/admin/rewards', icon: Gift, color: 'text-yellow-400' },
        { name: 'Reports', path: '/admin/reports', icon: BarChart3, color: 'text-purple-400' },
        { name: 'Inventory', path: '/admin/inventory', icon: Package, color: 'text-orange-400' },
        { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      teacher: [
        { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'Students', path: '/teacher/students', icon: GraduationCap, color: 'text-green-400' },
        { name: 'QR Codes', path: '/teacher/qr-codes', icon: QrCode, color: 'text-purple-400' },
        // REPORTS REMOVED FROM TEACHER SIDEBAR
        { name: 'Settings', path: '/teacher/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      canteen_staff: [
        { name: 'Dashboard', path: '/canteen', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'Scan & Redeem', path: '/canteen/scan', icon: QrCode, color: 'text-green-400' },
        { name: 'History', path: '/canteen/history', icon: ShoppingBag, color: 'text-purple-400' },
        { name: 'Rewards', path: '/canteen/rewards', icon: Gift, color: 'text-yellow-400' },
        { name: 'Settings', path: '/canteen/settings', icon: SettingsIcon, color: 'text-gray-400' },
      ],
      junk_shop_personnel: [
        { name: 'Dashboard', path: '/junk', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: 'Collection Status', path: '/junk/status', icon: Truck, color: 'text-green-400' },
        { name: 'Pickups', path: '/junk/pickups', icon: Recycle, color: 'text-purple-400' },
        { name: 'History', path: '/junk/history', icon: BarChart3, color: 'text-orange-400' },
        { name: 'Settings', path: '/junk/settings', icon: SettingsIcon, color: 'text-gray-400' },
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

  const getRoleIcon = () => {
    const role = currentUser?.role;
    const icons = {
      administrator: <Shield size={24} className="text-green-400" />,
      teacher: <GraduationCap size={24} className="text-blue-400" />,
      canteen_staff: <Coffee size={24} className="text-orange-400" />,
      junk_shop_personnel: <Recycle size={24} className="text-green-400" />,
      student: <GraduationCap size={24} className="text-teal-400" />,
    };
    return icons[role] || <User size={24} />;
  };

  const getRoleColor = () => {
    const role = currentUser?.role;
    const colors = {
      administrator: 'from-green-700 to-green-900',
      teacher: 'from-blue-700 to-blue-900',
      canteen_staff: 'from-orange-700 to-orange-900',
      junk_shop_personnel: 'from-emerald-700 to-emerald-900',
      student: 'from-teal-700 to-teal-900',
    };
    return colors[role] || 'from-green-700 to-green-900';
  };

  const getRoleDisplayName = () => {
    const role = currentUser?.role;
    const names = {
      administrator: 'Administrator',
      teacher: 'Teacher',
      canteen_staff: 'Canteen Staff',
      junk_shop_personnel: 'Junk Shop',
      student: 'Student',
    };
    return names[role] || 'User';
  };

  const navItems = getNavItems();
  const currentPath = location.pathname;

  const getPageTitle = () => {
    const currentItem = navItems.find(item => currentPath === item.path || currentPath.startsWith(item.path + '/'));
    return currentItem?.name || 'Dashboard';
  };

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={`p-5 border-b border-white/10 ${sidebarCollapsed && !isMobile ? 'px-3' : ''}`}>
        <div className={`flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
            ♻️
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-1">
              <h1 className="text-lg font-bold tracking-wide">ReBot</h1>
              <p className="text-xs text-white/60">Patubig Elementary</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className={`p-4 border-b border-white/10 ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center text-lg font-bold ring-2 ring-white/30 overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={currentUser?.fullName || 'User'}
                  className="w-full h-full object-cover user-avatar-image"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-white text-lg font-bold">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white/20"></div>
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser?.fullName || 'User'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${currentUser?.isActive !== false ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <p className="text-xs text-white/70 capitalize">{getRoleDisplayName()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/admin' && currentPath?.startsWith(item.path));
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) closeMobileMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
                title={sidebarCollapsed && !isMobile ? item.name : ''}
              >
                <item.icon size={20} className={isActive ? 'text-white' : item.color} />
                {(!sidebarCollapsed || isMobile) && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">{item.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className={`p-4 border-t border-white/10 ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className="space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200
              ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed && !isMobile ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {(!sidebarCollapsed || isMobile) && (
              <span className="font-medium text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200
              ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed && !isMobile ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {(!sidebarCollapsed || isMobile) && (
              <span className="font-medium text-sm">Logout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
      >
        <MenuIcon size={20} />
      </button>

      {/* Desktop Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex fixed top-20 z-50 p-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        style={{ left: sidebarCollapsed ? '70px' : '288px' }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block fixed top-0 left-0 z-40 h-screen 
          bg-gradient-to-b ${getRoleColor()} text-white
          transition-all duration-300 ease-in-out shadow-2xl
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 w-72 h-screen transition-transform duration-300 ease-out
          bg-gradient-to-b ${getRoleColor()} text-white shadow-2xl
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${!isMobile && !sidebarCollapsed ? 'lg:ml-72' : !isMobile && sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-0'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 lg:px-6 lg:py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-10" />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
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

            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 lg:gap-3 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={currentUser?.fullName || 'User'}
                      className="w-full h-full object-cover user-avatar-image"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {currentUser?.fullName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{currentUser?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getRoleDisplayName()}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-40 overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500/10 to-green-600/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={currentUser?.fullName || 'User'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>{currentUser?.fullName?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser?.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(`/${currentUser?.role}/settings`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Date Bar */}
          <div className="lg:hidden px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
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

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}