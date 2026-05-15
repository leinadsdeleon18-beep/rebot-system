import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    const role = user?.role;
    
    const navItems = {
      administrator: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Rewards Management', path: '/admin/rewards', icon: Gift },
        { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
        { name: 'Inventory', path: '/admin/inventory', icon: Package },
        { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
      ],
      teacher: [
        { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
        { name: 'Students', path: '/teacher/students', icon: GraduationCap },
        { name: 'QR Codes', path: '/teacher/qr-codes', icon: QrCode },
        { name: 'Rewards', path: '/teacher/rewards', icon: Gift },
        { name: 'Settings', path: '/teacher/settings', icon: SettingsIcon },
      ],
      canteen_staff: [
        { name: 'Dashboard', path: '/canteen', icon: LayoutDashboard },
        { name: 'Scan & Redeem', path: '/canteen/scan', icon: QrCode },
        { name: 'History', path: '/canteen/history', icon: ShoppingBag },
        { name: 'Rewards', path: '/canteen/rewards', icon: Gift },
        { name: 'Settings', path: '/canteen/settings', icon: SettingsIcon },
      ],
      junk_shop_personnel: [
        { name: 'Dashboard', path: '/junk', icon: LayoutDashboard },
        { name: 'Collection Status', path: '/junk/status', icon: Truck },
        { name: 'Pickups', path: '/junk/pickups', icon: Recycle },
        { name: 'History', path: '/junk/history', icon: BarChart3 },
        { name: 'Settings', path: '/junk/settings', icon: SettingsIcon },
      ],
      student: [
        { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
        { name: 'My Points', path: '/student/points', icon: Gift },
        { name: 'History', path: '/student/history', icon: ShoppingBag },
        { name: 'Settings', path: '/student/settings', icon: SettingsIcon },
      ],
    };
    
    return navItems[role] || navItems.student;
  };

  const getRoleIcon = () => {
    const role = user?.role;
    const icons = {
      administrator: <Shield size={20} className="text-green-400" />,
      teacher: <GraduationCap size={20} className="text-blue-400" />,
      canteen_staff: <Coffee size={20} className="text-orange-400" />,
      junk_shop_personnel: <Recycle size={20} className="text-green-400" />,
      student: <GraduationCap size={20} className="text-teal-400" />,
    };
    return icons[role] || <User size={20} />;
  };

  const getRoleColor = () => {
    const role = user?.role;
    const colors = {
      administrator: 'from-green-600 to-green-800',
      teacher: 'from-blue-600 to-blue-800',
      canteen_staff: 'from-orange-600 to-orange-800',
      junk_shop_personnel: 'from-green-600 to-green-800',
      student: 'from-teal-600 to-teal-800',
    };
    return colors[role] || 'from-green-600 to-green-800';
  };

  const getRoleDisplayName = () => {
    const role = user?.role;
    const names = {
      administrator: 'Admin',
      teacher: 'Teacher',
      canteen_staff: 'Canteen',
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-72 h-screen transition-transform duration-300 bg-gradient-to-b ${getRoleColor()} text-white ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
              ♻️
            </div>
            <div>
              <h1 className="text-xl font-bold">ReBot</h1>
              <p className="text-xs text-white/70">Patubig Elementary School</p>
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-white/70 capitalize">{getRoleDisplayName()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/admin' && currentPath?.startsWith(item.path));
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition mb-2"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getRoleDisplayName()}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(`/${user?.role}/settings`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}