import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Moon, 
  Sun, 
  Database, 
  Bell, 
  Shield, 
  Save, 
  Camera, 
  LogOut,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Smartphone,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

// Settings icon component
const SettingsIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function Settings({ userRole = 'admin', userData = {}, onLogout }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    fullName: userData.fullName || 'Admin User',
    email: userData.email || 'admin@rebot.ph',
    phone: userData.phone || '+63 912 345 6789',
    school: 'Patubig Elementary School',
    position: userData.role === 'admin' ? 'System Administrator' : 
             userData.role === 'teacher' ? 'Grade School Teacher' :
             userData.role === 'canteen' ? 'Canteen Manager' :
             userData.role === 'junk' ? 'Recycling Coordinator' : 'Student',
    address: userData.address || 'Patubig, Marilao, Bulacan',
    bio: userData.bio || ''
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    lowStockAlerts: true,
    redemptionAlerts: true,
    weeklyReports: false,
    marketingEmails: false
  });
  
  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginNotifications: true
  });
  
  // System settings (admin only)
  const [systemConfig, setSystemConfig] = useState({
    bottlesPerPoint: 5,
    paperPerPoint: 50,
    inventoryThreshold: 20,
    maintenanceMode: false,
    autoBackup: true
  });
  
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Activity log
  const [recentActivity] = useState([
    { id: 1, action: 'Logged in', timestamp: '2026-04-04 09:30 AM', ip: '192.168.1.1', device: 'Chrome on Windows' },
    { id: 2, action: 'Updated profile', timestamp: '2026-04-03 02:15 PM', ip: '192.168.1.1', device: 'Chrome on Windows' },
    { id: 3, action: 'Changed password', timestamp: '2026-04-01 10:00 AM', ip: '192.168.1.1', device: 'Chrome on Windows' },
    { id: 4, action: 'Logged in', timestamp: '2026-03-30 08:30 AM', ip: '192.168.1.1', device: 'Mobile App' }
  ]);
  
  const handleProfileUpdate = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Profile updated successfully!');
    setSaving(false);
  };
  
  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Password changed successfully!');
    setPasswordData({ current: '', new: '', confirm: '' });
    setSaving(false);
  };
  
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        toast.success('Avatar updated!');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleExportData = () => {
    const exportData = {
      user: profile,
      settings: { notifications, security },
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebot_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };
  
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          JSON.parse(event.target.result);
          toast.success('Data imported successfully!');
        } catch (error) {
          toast.error('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleResetAll = () => {
    if (window.confirm('⚠️ WARNING: This will reset all settings to default. This action cannot be undone. Are you sure?')) {
      toast.success('Settings reset to default');
    }
  };
  
  const handleSaveSystemSettings = () => {
    toast.success('System settings saved!');
  };
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'activity', label: 'Activity Log', icon: Clock }
  ];
  
  if (userRole === 'admin') {
    tabs.splice(4, 0, { id: 'system', label: 'System', icon: SettingsIcon });
  }
  
  const TabButton = ({ tab }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isActive
            ? 'bg-green-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon size={18} />
        <span className="text-sm font-medium">{tab.label}</span>
      </button>
    );
  };
  
  const SettingSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 transition-colors duration-200">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
        <Icon size={20} className="text-green-600 dark:text-green-500" />
        {title}
      </h3>
      {children}
    </div>
  );
  
  const SettingRow = ({ label, description, children }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and configuration</p>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(tab => (
          <TabButton key={tab.id} tab={tab} />
        ))}
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center transition-colors duration-200">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl text-white font-bold">
                    {profile.fullName.charAt(0)}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700 transition shadow-lg">
                <Camera size={16} className="text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4">{profile.fullName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Member since 2024</p>
          </div>
          
          {/* Profile Form */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 transition-colors duration-200">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
                <input
                  type="text"
                  value={profile.school}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors duration-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            <button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
      
      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingSection title="Change Password" icon={Lock}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl pr-10 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                    placeholder="Enter current password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition shadow-md"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </SettingSection>
          
          <SettingSection title="Two-Factor Authentication" icon={Shield}>
            <div className="space-y-4">
              <SettingRow label="Enable 2FA" description="Add an extra layer of security">
                <button
                  onClick={() => setSecurity({ ...security, twoFactorAuth: !security.twoFactorAuth })}
                  className={`w-12 h-6 rounded-full transition-all ${
                    security.twoFactorAuth ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </SettingRow>
              <SettingRow label="Session Timeout" description="Auto logout after inactivity">
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </SettingRow>
              <SettingRow label="Login Notifications" description="Email me on new login">
                <button
                  onClick={() => setSecurity({ ...security, loginNotifications: !security.loginNotifications })}
                  className={`w-12 h-6 rounded-full transition-all ${
                    security.loginNotifications ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    security.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </SettingRow>
            </div>
          </SettingSection>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 transition-colors duration-200">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <SettingRow label="Email Alerts" description="Receive notifications via email">
              <button
                onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.emailAlerts ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.emailAlerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
            <SettingRow label="Push Notifications" description="Browser notifications">
              <button
                onClick={() => setNotifications({ ...notifications, pushNotifications: !notifications.pushNotifications })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.pushNotifications ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
            <SettingRow label="Low Stock Alerts" description="Notify when inventory is low">
              <button
                onClick={() => setNotifications({ ...notifications, lowStockAlerts: !notifications.lowStockAlerts })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.lowStockAlerts ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.lowStockAlerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
            <SettingRow label="Redemption Alerts" description="Notify when students redeem rewards">
              <button
                onClick={() => setNotifications({ ...notifications, redemptionAlerts: !notifications.redemptionAlerts })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.redemptionAlerts ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.redemptionAlerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
            <SettingRow label="Weekly Reports" description="Receive weekly summary reports">
              <button
                onClick={() => setNotifications({ ...notifications, weeklyReports: !notifications.weeklyReports })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.weeklyReports ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
          </div>
        </div>
      )}
      
      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 transition-colors duration-200">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Theme Preferences</h3>
          <SettingRow label="Dark Mode" description="Switch between light and dark theme">
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-all ${
                darkMode ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </SettingRow>
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview</p>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-600 transition-colors duration-200"></div>
              <div className="w-20 h-20 bg-gray-900 dark:bg-gray-100 rounded-lg shadow border border-gray-200 dark:border-gray-600 transition-colors duration-200"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingSection title="Backup & Restore" icon={Database}>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full px-4 py-3 border border-green-600 text-green-600 dark:text-green-400 rounded-xl font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Export All Data
              </button>
              <label className="w-full px-4 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={18} /> Import from File
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
              <button
                onClick={handleResetAll}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-md"
              >
                <Trash2 size={18} /> Reset All Settings
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                ⚠️ Reset will clear all your preferences. Make sure to backup first.
              </p>
            </div>
          </SettingSection>
          
          <SettingSection title="Account Actions" icon={LogOut}>
            <div className="space-y-3">
              <button
                onClick={() => toast.success('Download started...')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Download Activity Log
              </button>
              <button
                onClick={onLogout}
                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-md"
              >
                <LogOut size={18} /> Logout from All Devices
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Permanently delete your account? This cannot be undone.')) {
                    toast.success('Account deletion request submitted');
                  }
                }}
                className="w-full px-4 py-3 border border-red-600 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Delete Account
              </button>
            </div>
          </SettingSection>
        </div>
      )}
      
      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your recent account activities</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivity.map(activity => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{activity.action}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{activity.device} • {activity.ip}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* System Tab (Admin Only) */}
      {activeTab === 'system' && userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingSection title="System Configuration" icon={SettingsIcon}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bottles per Point</label>
                <input
                  type="number"
                  value={systemConfig.bottlesPerPoint}
                  onChange={(e) => setSystemConfig({ ...systemConfig, bottlesPerPoint: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paper (g) per Point</label>
                <input
                  type="number"
                  value={systemConfig.paperPerPoint}
                  onChange={(e) => setSystemConfig({ ...systemConfig, paperPerPoint: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={systemConfig.inventoryThreshold}
                  onChange={(e) => setSystemConfig({ ...systemConfig, inventoryThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                />
              </div>
              <button
                onClick={handleSaveSystemSettings}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition shadow-md"
              >
                Save System Settings
              </button>
            </div>
          </SettingSection>
          
          <SettingSection title="Maintenance" icon={SettingsIcon}>
            <SettingRow label="Maintenance Mode" description="Put site under maintenance">
              <button
                onClick={() => setSystemConfig({ ...systemConfig, maintenanceMode: !systemConfig.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-all ${
                  systemConfig.maintenanceMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
            <SettingRow label="Auto Backup" description="Automatic daily backups">
              <button
                onClick={() => setSystemConfig({ ...systemConfig, autoBackup: !systemConfig.autoBackup })}
                className={`w-12 h-6 rounded-full transition-all ${
                  systemConfig.autoBackup ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  systemConfig.autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </SettingRow>
          </SettingSection>
        </div>
      )}
    </div>
  );
}