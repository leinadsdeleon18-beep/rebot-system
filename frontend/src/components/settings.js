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
  FileText,
  AlertCircle,
  Check,
  X,
  Loader,
  AlertTriangle
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

const TabButton = ({ tab, activeTab, setActiveTab }) => {
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
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
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
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {description}
        </p>
      )}
    </div>
    {children}
  </div>
);

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        
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
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Remove Avatar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Settings({ userRole = 'admin', userData = {}, onLogout }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: 'Patubig Elementary School',
    position: '',
    address: '',
    bio: ''
  });
  
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '', color: '' });
  const [userId, setUserId] = useState(null);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    lowStockAlerts: true,
    redemptionAlerts: true,
    weeklyReports: false,
    marketingEmails: false
  });
  
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginNotifications: true
  });
  
  const [recentActivity, setRecentActivity] = useState([]);

  // Helper function to compress image before upload
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxSize = 200;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Function to update avatar everywhere (Settings + Sidebar)
  const updateGlobalAvatar = (newAvatarUrl) => {
    // Update local state
    setAvatarUrl(newAvatarUrl);
    
    // Update localStorage
    const userStr = localStorage.getItem('rebot_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.avatar = newAvatarUrl;
      localStorage.setItem('rebot_user', JSON.stringify(user));
    }
    
    // Dispatch a custom event so Layout component can update
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: newAvatarUrl } }));
  };

  // Fetch user profile from server
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/upload/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          const user = data.user;
          setUserId(user._id);
          setProfile({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            school: 'Patubig Elementary School',
            position: userRole === 'admin' ? 'System Administrator' : 
                     userRole === 'teacher' ? 'Grade School Teacher' :
                     userRole === 'canteen' ? 'Canteen Manager' :
                     userRole === 'junk' ? 'Recycling Coordinator' : 'Student',
            address: user.address || 'Patubig, Marilao, Bulacan',
            bio: user.bio || ''
          });
          setAvatarUrl(user.avatar);
          
          const storedUser = JSON.parse(localStorage.getItem('rebot_user') || '{}');
          const updatedUser = { ...storedUser, ...user };
          localStorage.setItem('rebot_user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
    fetchActivityLog();
  }, [userRole]);

  const fetchActivityLog = async () => {
    setRecentActivity([
      { id: 1, action: 'Logged in', timestamp: new Date().toLocaleString(), ip: '192.168.1.1', device: 'Chrome on Windows' },
      { id: 2, action: 'Updated profile', timestamp: new Date(Date.now() - 86400000).toLocaleString(), ip: '192.168.1.1', device: 'Chrome on Windows' },
    ]);
  };

  const updatePasswordFeedback = (password) => {
    setPasswordRequirements({
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    let text = '';
    let color = '';
    if (password.length === 0) {
      text = '';
      color = '';
    } else if (strength <= 2) {
      text = 'Weak';
      color = 'text-red-500';
    } else if (strength <= 4) {
      text = 'Medium';
      color = 'text-yellow-500';
    } else {
      text = 'Strong';
      color = 'text-green-500';
    }
    setPasswordStrength({ strength, text, color });
  };

  // AVATAR UPLOAD FUNCTION - Updates in real-time
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('avatar', compressedFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update avatar everywhere without refresh
        updateGlobalAvatar(data.avatarUrl);
        toast.success('Avatar updated successfully!');
      } else {
        toast.error(data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // DELETE AVATAR FUNCTION - Updates in real-time
  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload/avatar', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update avatar everywhere without refresh (set to null)
        updateGlobalAvatar(null);
        toast.success('Avatar removed successfully');
        setShowRemoveModal(false);
      } else {
        toast.error(data.message || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setRemovingAvatar(false);
    }
  };

  // UPDATE PROFILE FUNCTION
  const handleProfileUpdate = async () => {
    if (!profile.fullName || !profile.email) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userStr = localStorage.getItem('rebot_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const updatedUser = { ...user, ...profile };
          localStorage.setItem('rebot_user', JSON.stringify(updatedUser));
        }
        
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // CHANGE PASSWORD FUNCTION
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    const allRequirementsMet = passwordRequirements.minLength && 
                                passwordRequirements.hasUpperCase && 
                                passwordRequirements.hasLowerCase && 
                                passwordRequirements.hasNumber && 
                                passwordRequirements.hasSpecialChar;
    if (!allRequirementsMet) {
      toast.error('Please meet all password requirements');
      return;
    }
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordRequirements({
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false
        });
        setPasswordStrength({ strength: 0, text: '', color: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
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
          const importedData = JSON.parse(event.target.result);
          if (importedData.user) {
            setProfile(importedData.user);
            toast.success('Data imported successfully!');
          } else {
            toast.error('Invalid file format');
          }
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

  // Tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'activity', label: 'Activity Log', icon: Clock }
  ];
  
  if (userRole === 'admin') {
    tabs.splice(3, 0, { id: 'system', label: 'System', icon: SettingsIcon });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal for Avatar Removal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveAvatar}
        loading={removingAvatar}
        title="Remove Avatar"
        message="Are you sure you want to remove your profile picture? This action cannot be undone."
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and configuration</p>
      </div>
      
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ))}
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto overflow-hidden">
                {uploadingAvatar ? (
                  <div className="flex items-center justify-center w-full h-full bg-gray-800/50">
                    <Loader size={32} className="animate-spin text-white" />
                  </div>
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl text-white font-bold">
                    {profile.fullName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700 transition shadow-lg">
                <Camera size={16} className="text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
              </label>
              {avatarUrl && (
                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="absolute bottom-0 left-0 bg-red-500 rounded-full p-2 cursor-pointer hover:bg-red-600 transition shadow-lg"
                  title="Remove Avatar"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4">{profile.fullName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Avatar stored in Cloudinary CDN</p>
          </div>
          
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">School</label>
                <input type="text" value={profile.school} disabled className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  rows="3"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Shield size={16} /> Password Requirements:
                </p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                    {passwordRequirements.minLength ? <Check size={14} /> : <X size={14} />}
                    At least 6 characters long
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-gray-600'}`}>
                    {passwordRequirements.hasUpperCase ? <Check size={14} /> : <X size={14} />}
                    At least one uppercase letter (A-Z)
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-gray-600'}`}>
                    {passwordRequirements.hasLowerCase ? <Check size={14} /> : <X size={14} />}
                    At least one lowercase letter (a-z)
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                    {passwordRequirements.hasNumber ? <Check size={14} /> : <X size={14} />}
                    At least one number (0-9)
                  </li>
                  <li className={`flex items-center gap-2 ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}`}>
                    {passwordRequirements.hasSpecialChar ? <Check size={14} /> : <X size={14} />}
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      updatePasswordFeedback(e.target.value);
                    }}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                            backgroundColor: passwordStrength.strength <= 2 ? '#ef4444' : passwordStrength.strength <= 4 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              
              <button
                onClick={handlePasswordChange}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordRequirements.minLength || !passwordRequirements.hasUpperCase || !passwordRequirements.hasLowerCase || !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                    security.twoFactorAuth ? 'bg-green-600' : 'bg-gray-300'
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
                  className="px-3 py-1 border rounded-lg bg-white"
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
                    security.loginNotifications ? 'bg-green-600' : 'bg-gray-300'
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <SettingRow label="Email Alerts" description="Receive notifications via email">
              <button
                onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications.emailAlerts ? 'bg-green-600' : 'bg-gray-300'
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
                  notifications.pushNotifications ? 'bg-green-600' : 'bg-gray-300'
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
                  notifications.lowStockAlerts ? 'bg-green-600' : 'bg-gray-300'
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
                  notifications.redemptionAlerts ? 'bg-green-600' : 'bg-gray-300'
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
                  notifications.weeklyReports ? 'bg-green-600' : 'bg-gray-300'
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
      
      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingSection title="Backup & Restore" icon={Database}>
            <div className="space-y-3">
              <button onClick={handleExportData} className="w-full px-4 py-3 border border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-50 transition flex items-center justify-center gap-2">
                <Download size={18} /> Export All Data
              </button>
              <label className="w-full px-4 py-3 border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={18} /> Import from File
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
              <button onClick={handleResetAll} className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-md">
                <Trash2 size={18} /> Reset All Settings
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                ⚠️ Reset will clear your preferences. Make sure to backup first.
              </p>
            </div>
          </SettingSection>
          
          <SettingSection title="Account Actions" icon={LogOut}>
            <div className="space-y-3">
              <button onClick={() => toast.success('Download started...')} className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <FileText size={18} /> Download Activity Log
              </button>
              <button onClick={onLogout} className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-md">
                <LogOut size={18} /> Logout from All Devices
              </button>
            </div>
          </SettingSection>
        </div>
      )}
      
      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Recent Activity</h3>
            <p className="text-sm text-gray-500 mt-1">Your recent account activities</p>
          </div>
          <div className="divide-y">
            {recentActivity.map(activity => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.device} • {activity.ip}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{activity.timestamp}</p>
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
              <div><label className="block text-sm font-medium mb-1">Bottles per Point</label><input type="number" value="5" className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Paper (g) per Point</label><input type="number" value="50" className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Low Stock Threshold</label><input type="number" value="20" className="w-full px-4 py-2 border rounded-xl" /></div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition shadow-md">Save System Settings</button>
            </div>
          </SettingSection>
          <SettingSection title="Maintenance" icon={SettingsIcon}>
            <SettingRow label="Maintenance Mode" description="Put site under maintenance">
              <button className="w-12 h-6 rounded-full bg-gray-300"><div className="w-5 h-5 bg-white rounded-full translate-x-1" /></button>
            </SettingRow>
            <SettingRow label="Auto Backup" description="Automatic daily backups">
              <button className="w-12 h-6 rounded-full bg-green-600"><div className="w-5 h-5 bg-white rounded-full translate-x-6" /></button>
            </SettingRow>
          </SettingSection>
        </div>
      )}
    </div>
  );
}