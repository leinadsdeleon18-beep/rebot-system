import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Menu,
  X,
  LogOut,
  Settings as SettingsIcon,
  LayoutGrid,
  UsersRound,
  Gift,
  Package,
  ChartNoAxesColumn,
  Moon,
  Sun,
  ScanLine,
  History,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Coins,
  Calendar,
  BookOpen,
  Loader,
  Recycle,
  Clock3
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Layout.css';

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
  const drawerToggle = useRef(null);
  const drawerClose = useRef(null);

  useEffect(() => {
    setCurrentUser(user);
    setUserAvatar(user?.avatar || null);
  }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      const newAvatarUrl = event.detail?.avatarUrl;
      setUserAvatar(newAvatarUrl);


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
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  useEffect(() => {
    if (!mobileNavOpen) return;
    drawerClose.current?.focus();
    const toggle = drawerToggle.current;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      toggle?.focus();
    };
  }, [mobileNavOpen]);
  const navByRole = {
    administrator: [
      { label: 'Overview', items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutGrid },
        { name: 'Timestamps', path: '/admin/timestamps', icon: Clock3 },
        { name: 'Reports', path: '/admin/reports', icon: ChartNoAxesColumn },
      ] },
      { label: 'School management', items: [
        { name: 'User Management', path: '/admin/users', icon: UsersRound },
        { name: 'Section Management', path: '/admin/sections', icon: BookOpen },
      ] },
      { label: 'Rewards', items: [
        { name: 'Rewards', path: '/admin/rewards', icon: Gift },
        { name: 'Inventory', path: '/admin/inventory', icon: Package },
      ] },
      { label: 'Account', items: [{ name: 'Settings', path: '/admin/settings', icon: SettingsIcon }] },
    ],
    teacher: [
      { label: 'Overview', items: [
        { name: 'Dashboard', path: '/teacher', icon: LayoutGrid },
        { name: 'Timestamps', path: '/teacher/timestamps', icon: Clock3 },
      ] },
      { label: 'Classroom', items: [{ name: 'Students', path: '/teacher/students', icon: GraduationCap }] },
      { label: 'Account', items: [{ name: 'Settings', path: '/teacher/settings', icon: SettingsIcon }] },
    ],
    canteen_staff: [
      { label: 'Overview', items: [
        { name: 'Dashboard', path: '/canteen', icon: LayoutGrid },
        { name: 'Timestamps', path: '/canteen/timestamps', icon: Clock3 },
      ] },
      { label: 'Canteen operations', items: [
        { name: 'Scan & Redeem', path: '/canteen/scan', icon: ScanLine },
        { name: 'History', path: '/canteen/history', icon: History },
        { name: 'Rewards', path: '/canteen/rewards', icon: Gift },
      ] },
      { label: 'Account', items: [{ name: 'Settings', path: '/canteen/settings', icon: SettingsIcon }] },
    ],
    student: [
      { label: 'My recycling', items: [
        { name: 'Dashboard', path: '/student', icon: LayoutGrid },
        { name: 'My Points', path: '/student/points', icon: Coins },
        { name: 'History', path: '/student/history', icon: History },
      ] },
      { label: 'Account', items: [{ name: 'Settings', path: '/student/settings', icon: SettingsIcon }] },
    ]
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

  const navGroups = navByRole[currentUser?.role] || navByRole.student;
  const navItems = navGroups.flatMap(group => group.items);
  const dashboardPath = navItems[0].path;
  const currentPath = location.pathname;
  const activeNavItem = navItems
    .filter((item) => currentPath === item.path || currentPath.startsWith(`${item.path}/`))
    .reduce((activeItem, item) => (
      !activeItem || item.path.length > activeItem.path.length ? item : activeItem
    ), null);

  const overview = currentPath === dashboardPath || currentPath === dashboardPath + "/";
  const pageTitle = activeNavItem?.name || 'Dashboard';
  const displayName = currentUser?.fullName || 'User';
  const themeAction = darkMode ? 'Light mode' : 'Dark mode';

  return (
    <div className="app-shell rebot-workspace" data-collapsed={sidebarCollapsed}>
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />

      <aside id="rebot-workspace-sidebar" className={mobileNavOpen ? 'rebot-sidebar is-open' : 'rebot-sidebar'}>
        <div className="rebot-workspace-brand">
          <span className="rebot-workspace-mark"><Recycle size={22} aria-hidden="true" /></span>
          <div className="rebot-sidebar-label">
            <strong>ReBot</strong>
            <small>Patubig Elementary School</small>
          </div>
          <button ref={drawerClose} type="button" className="rebot-workspace-control rebot-drawer-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <nav className="rebot-workspace-nav" aria-label="Workspace navigation">
          {navGroups.map(({ label, items }) => (
            <div className="rebot-nav-group" key={label} role="group" aria-label={label}>
              <p className="rebot-nav-label" aria-hidden="true">{label}</p>
              {items.map(({ name, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileNavOpen(false)}
                  className="rebot-workspace-link"
                  aria-label={name}
                  aria-current={activeNavItem?.path === path ? 'page' : undefined}
                  title={sidebarCollapsed ? name : undefined}
                >
                  <Icon className="rebot-nav-icon" size={18} strokeWidth={1.65} aria-hidden="true" />
                  <span className="rebot-sidebar-label">{name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="rebot-workspace-account">
          <button type="button" className="rebot-workspace-link" aria-label={themeAction} title={sidebarCollapsed ? themeAction : undefined} onClick={toggleDarkMode}>
            {darkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            <span className="rebot-sidebar-label">{themeAction}</span>
          </button>
          <button type="button" className="rebot-workspace-link rebot-logout" aria-label="Sign out" title={sidebarCollapsed ? 'Sign out' : undefined} onClick={handleLogoutClick}>
            <LogOut size={19} aria-hidden="true" />
            <span className="rebot-sidebar-label">Sign out</span>
          </button>
          <div className="rebot-workspace-profile" title={sidebarCollapsed ? displayName : undefined}>
            {userAvatar ? (
              <img src={userAvatar} alt="" className="user-avatar-image" referrerPolicy="no-referrer" />
            ) : (
              <span className="rebot-workspace-initial" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
            )}
            <div className="rebot-sidebar-label">
              <strong>{displayName}</strong>
              <small>{getRoleDisplayName()}</small>
            </div>
          </div>
        </div>
      </aside>

      {mobileNavOpen && <div className="rebot-drawer-overlay" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />}

      <div className="rebot-workspace-body">
        <header className="rebot-workspace-header">
          <div>
            <button ref={drawerToggle} type="button" className="rebot-workspace-control rebot-drawer-toggle" aria-label="Open navigation" aria-expanded={mobileNavOpen} aria-controls="rebot-workspace-sidebar" onClick={() => setMobileNavOpen(true)}>
              <Menu size={20} aria-hidden="true" />
            </button>
            <button type="button" className="rebot-workspace-control rebot-sidebar-toggle" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} aria-controls="rebot-workspace-sidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? <ChevronRight size={19} aria-hidden="true" /> : <ChevronLeft size={19} aria-hidden="true" />}
            </button>
            <div className="rebot-workspace-crumb">
              <Link to={dashboardPath} className="rebot-workspace-role">{getRoleDisplayName()}</Link>
              <ChevronRight size={14} aria-hidden="true" />
              <h1 key={pageTitle}>{pageTitle}</h1>
            </div>
          </div>
          <span className="rebot-workspace-date">
            <Calendar size={16} aria-hidden="true" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </header>
        <main id="rebot-workspace-content">
          <div className={overview ? "rebot-workspace-content" : "rebot-workspace-content rb-feature-page"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
