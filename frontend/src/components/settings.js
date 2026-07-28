import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Shield, 
  Save, 
  Camera, 
  LogOut,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Check,
  X,
  Loader,
  AlertTriangle,
  Edit2,
  Save as SaveIcon,
  XCircle,
  Gift,
  Package,
  RefreshCw,
  Droplet,
  Beer
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

// Bottle Points Configuration Component
const BottlePointsConfig = ({ 
  bottle1500Points, 
  petBottlePoints, 
  editingBottle, 
  editingPoints, 
  setEditingPoints, 
  startEditing, 
  cancelEditing, 
  handleUpdateBottlePoints,
  loadingRewards,
  onRefresh 
}) => {
  if (loadingRewards) {
    return (
      <SettingSection title="Bottle Points Configuration" icon={Package}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading bottle points...</p>
        </div>
      </SettingSection>
    );
  }

  return (
    <SettingSection title="Bottle Points Configuration" icon={Package}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set how many points students earn for each bottle type
          </p>
          <button
            onClick={onRefresh}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1.5L Bottle */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🥤</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">1.5L Bottle</h4>
                  <p className="text-xs text-gray-500">Large plastic bottle</p>
                </div>
              </div>
              {!editingBottle && (
                <button
                  onClick={() => startEditing('1.5l')}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 size={20} />
                </button>
              )}
            </div>
            
            {editingBottle === '1.5l' ? (
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="number"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter points"
                  min="1"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateBottlePoints('1.5l', editingPoints)}
                  className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  <SaveIcon size={20} />
                </button>
                <button
                  onClick={cancelEditing}
                  className="p-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points per bottle:</p>
                <p className="text-4xl font-bold text-green-600">
                  {bottle1500Points} points
                </p>
              </div>
            )}
          </div>

          {/* PET Bottle */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🍾</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">PET Bottle</h4>
                  <p className="text-xs text-gray-500">Regular plastic bottle</p>
                </div>
              </div>
              {!editingBottle && (
                <button
                  onClick={() => startEditing('pet')}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 size={20} />
                </button>
              )}
            </div>
            
            {editingBottle === 'pet' ? (
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="number"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter points"
                  min="1"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateBottlePoints('pet', editingPoints)}
                  className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  <SaveIcon size={20} />
                </button>
                <button
                  onClick={cancelEditing}
                  className="p-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points per bottle:</p>
                <p className="text-4xl font-bold text-blue-600">
                  {petBottlePoints} points
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
            <AlertCircle size={18} />
            These points will be awarded to students when they recycle each bottle type.
            Changes take effect immediately.
          </p>
        </div>
      </div>
    </SettingSection>
  );
};

// Machine Rewards Configuration Component
const MachineRewardsConfig = ({ rewards, loadingRewards, editingReward, editingPoints, setEditingPoints, startEditing, cancelEditing, handleUpdatePoints, onRefresh }) => {
  // Filter rewards that are for the machine (excluding bottle rewards)
  const machineRewards = rewards?.filter(r => 
    !r?.name?.toLowerCase().includes('bottle') &&
    !r?.name?.toLowerCase().includes('1.5') &&
    !r?.name?.toLowerCase().includes('pet')
  ) || [];

  if (loadingRewards) {
    return (
      <SettingSection title="Machine Rewards Configuration" icon={Gift}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading rewards...</p>
        </div>
      </SettingSection>
    );
  }

  return (
    <SettingSection title="Machine Rewards Configuration" icon={Gift}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set how many points are required to claim each reward
          </p>
          <button
            onClick={onRefresh}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        {machineRewards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <Gift size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rewards found</p>
            <p className="text-sm text-gray-400 mt-2">Add rewards in the Rewards Management page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machineRewards.map((reward) => (
              <div key={reward._id} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Gift size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{reward.name}</h4>
                      {reward.stock !== undefined && (
                        <p className="text-xs text-gray-500">Stock: {reward.stock}</p>
                      )}
                    </div>
                  </div>
                  {editingReward !== reward._id && (
                    <button
                      onClick={() => startEditing(reward)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
                
                {editingReward === reward._id ? (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="number"
                      value={editingPoints}
                      onChange={(e) => setEditingPoints(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter points"
                      min="1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdatePoints(reward._id, editingPoints)}
                      className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                    >
                      <SaveIcon size={18} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points required:</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {reward.pointsRequired || 0} points
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingSection>
  );
};

export default function Settings({ userRole = 'admin', userData = {}, onLogout, customProps }) {
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
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Bottle points state
  const [bottle1500Points, setBottle1500Points] = useState(8);
  const [petBottlePoints, setPetBottlePoints] = useState(5);
  const [editingBottle, setEditingBottle] = useState(null);
  const [editingPoints, setEditingPoints] = useState('');

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

  const updateGlobalAvatar = (newAvatarUrl) => {
    setAvatarUrl(newAvatarUrl);
    
    const userStr = localStorage.getItem('rebot_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.avatar = newAvatarUrl;
      localStorage.setItem('rebot_user', JSON.stringify(user));
    }
    
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: newAvatarUrl } }));
  };

  // Load bottle points from localStorage or API
  useEffect(() => {
    const loadBottlePoints = () => {
      const saved1500 = localStorage.getItem('bottle_1500_points');
      const savedPet = localStorage.getItem('bottle_pet_points');
      
      if (saved1500) setBottle1500Points(parseInt(saved1500));
      if (savedPet) setPetBottlePoints(parseInt(savedPet));
    };
    
    loadBottlePoints();
  }, []);

  // Save bottle points to localStorage
  const saveBottlePoints = (type, points) => {
    if (type === '1.5l') {
      setBottle1500Points(points);
      localStorage.setItem('bottle_1500_points', points.toString());
    } else if (type === 'pet') {
      setPetBottlePoints(points);
      localStorage.setItem('bottle_pet_points', points.toString());
    }
  };

  const handleUpdateBottlePoints = async (type, newPoints) => {
    const points = parseInt(newPoints);
    if (isNaN(points) || points < 1) {
      toast.error('Please enter a valid number greater than 0');
      return;
    }
    
    // Save to localStorage
    saveBottlePoints(type, points);
    
    // You can also send to API if needed
    // try {
    //   const token = localStorage.getItem('token');
    //   await fetch('http://localhost:5000/api/settings/bottle-points', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    //     body: JSON.stringify({ type, points })
    //   });
    // } catch (error) {
    //   console.error('Error saving bottle points:', error);
    // }
    
    toast.success(`${type === '1.5l' ? '1.5L Bottle' : 'PET Bottle'} points updated to ${points} points!`);
    setEditingBottle(null);
    setEditingPoints('');
  };

  const startEditingBottle = (type) => {
    setEditingBottle(type);
    setEditingPoints(type === '1.5l' ? bottle1500Points.toString() : petBottlePoints.toString());
  };

  const cancelEditingBottle = () => {
    setEditingBottle(null);
    setEditingPoints('');
  };

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

  // Tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'activity', label: 'Activity Log', icon: Clock }
  ];
  
  if (userRole === 'admin') {
    tabs.push({ id: 'bottle-points', label: 'Bottle Points', icon: Package });
    tabs.push({ id: 'machine-rewards', label: 'Machine Rewards', icon: Gift });
    tabs.push({ id: 'system', label: 'System', icon: SettingsIcon });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleRefreshRewards = () => {
    if (customProps?.fetchRewards) {
      customProps.fetchRewards();
    }
  };

  return (
    <div className="space-y-6">
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
        <div className="max-w-2xl mx-auto">
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
        </div>
      )}
      
      {/* Bottle Points Tab (Admin Only) */}
      {activeTab === 'bottle-points' && userRole === 'admin' && (
        <BottlePointsConfig
          bottle1500Points={bottle1500Points}
          petBottlePoints={petBottlePoints}
          editingBottle={editingBottle}
          editingPoints={editingPoints}
          setEditingPoints={setEditingPoints}
          startEditing={startEditingBottle}
          cancelEditing={cancelEditingBottle}
          handleUpdateBottlePoints={handleUpdateBottlePoints}
          loadingRewards={false}
          onRefresh={() => {
            const saved1500 = localStorage.getItem('bottle_1500_points');
            const savedPet = localStorage.getItem('bottle_pet_points');
            if (saved1500) setBottle1500Points(parseInt(saved1500));
            if (savedPet) setPetBottlePoints(parseInt(savedPet));
            toast.success('Points refreshed!');
          }}
        />
      )}
      
      {/* Machine Rewards Tab (Admin Only) */}
      {activeTab === 'machine-rewards' && userRole === 'admin' && customProps && (
        <MachineRewardsConfig
          rewards={customProps.rewards || []}
          loadingRewards={customProps.loadingRewards || false}
          editingReward={customProps.editingReward}
          editingPoints={customProps.editingPoints}
          setEditingPoints={customProps.setEditingPoints}
          startEditing={customProps.startEditing}
          cancelEditing={customProps.cancelEditing}
          handleUpdatePoints={customProps.handleUpdatePoints}
          onRefresh={handleRefreshRewards}
        />
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
              <div>
                <label className="block text-sm font-medium mb-1">Default Bottle Points</label>
                <input type="number" defaultValue="5" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Paper Points</label>
                <input type="number" defaultValue="50" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                <input type="number" defaultValue="20" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition shadow-md">
                Save System Settings
              </button>
            </div>
          </SettingSection>
          <SettingSection title="Maintenance" icon={SettingsIcon}>
            <SettingRow label="Maintenance Mode" description="Put site under maintenance">
              <button className="w-12 h-6 rounded-full bg-gray-300">
                <div className="w-5 h-5 bg-white rounded-full translate-x-1" />
              </button>
            </SettingRow>
            <SettingRow label="Auto Backup" description="Automatic daily backups">
              <button className="w-12 h-6 rounded-full bg-green-600">
                <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
              </button>
            </SettingRow>
          </SettingSection>
        </div>
      )}
    </div>
  );
}