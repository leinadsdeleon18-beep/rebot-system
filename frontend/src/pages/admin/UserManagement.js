import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX,
  Shield,
  BookOpen,
  Coffee,
  Recycle,
  Wrench,
  X,
  Key,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock users data
const mockUsers = [
  { id: 1, username: 'teacher123', fullName: 'Maria Santos', email: 'teacher@rebot.ph', role: 'Teacher', enabled: true, password: 'teacher123' },
  { id: 2, username: 'canteen123', fullName: 'Rosa Mercado', email: 'canteen@rebot.ph', role: 'Canteen Staff', enabled: true, password: 'canteen123' },
  { id: 3, username: 'junk123', fullName: 'Juan Reyes', email: 'junk@rebot.ph', role: 'Junk Shop', enabled: true, password: 'junk123' },
  { id: 4, username: 'utility123', fullName: 'Pedro Cruz', email: 'utility@rebot.ph', role: 'Utility Staff', enabled: true, password: 'utility123' },
  { id: 5, username: 'admin123', fullName: 'Admin User', email: 'admin@rebot.ph', role: 'Administrator', enabled: true, password: 'admin123' }
];

const roleOptions = [
  { value: 'teacher', label: 'Teacher', icon: BookOpen, color: 'bg-blue-100 text-blue-700', defaultPassword: 'teacher123' },
  { value: 'canteen', label: 'Canteen Staff', icon: Coffee, color: 'bg-orange-100 text-orange-700', defaultPassword: 'canteen123' },
  { value: 'junk', label: 'Junk Shop', icon: Recycle, color: 'bg-green-100 text-green-700', defaultPassword: 'junk123' },
  { value: 'utility', label: 'Utility Staff', icon: Wrench, color: 'bg-gray-100 text-gray-700', defaultPassword: 'utility123' },
  { value: 'admin', label: 'Administrator', icon: Shield, color: 'bg-purple-100 text-purple-700', defaultPassword: 'admin123' }
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState('auto');
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'teacher',
    password: '',
    confirmPassword: ''
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddUser = () => {
    if (!formData.username || !formData.fullName || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    if (users.some(u => u.username === formData.username)) {
      toast.error('Username already exists');
      return;
    }

    let finalPassword = '';
    if (passwordMethod === 'auto') {
      finalPassword = generateRandomPassword();
    } else {
      if (!formData.password) {
        toast.error('Please enter a password');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      finalPassword = formData.password;
    }

    const roleLabel = roleOptions.find(r => r.value === formData.role)?.label || formData.role;
    
    const newUser = {
      id: users.length + 1,
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      role: roleLabel,
      enabled: true,
      password: finalPassword
    };
    
    setUsers([...users, newUser]);
    setShowAddModal(false);
    setFormData({ username: '', fullName: '', email: '', role: 'teacher', password: '', confirmPassword: '' });
    
    if (passwordMethod === 'auto') {
      toast.success(`User added! Temporary password: ${finalPassword}`);
    } else {
      toast.success('User added successfully!');
    }
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    
    const newPassword = generateRandomPassword();
    setUsers(users.map(user => 
      user.id === selectedUser.id ? { ...user, password: newPassword } : user
    ));
    
    toast.success(`Password reset for ${selectedUser.fullName}. New password: ${newPassword}`);
    setShowResetModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role.toLowerCase().replace(' ', ''),
      password: '',
      confirmPassword: ''
    });
  };

  const handleUpdateUser = () => {
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill required fields');
      return;
    }

    const updatedUsers = users.map(user => 
      user.id === editingUser.id 
        ? { 
            ...user, 
            fullName: formData.fullName, 
            email: formData.email, 
            role: roleOptions.find(r => r.value === formData.role)?.label || formData.role 
          }
        : user
    );
    setUsers(updatedUsers);
    setEditingUser(null);
    setFormData({ username: '', fullName: '', email: '', role: 'teacher', password: '', confirmPassword: '' });
    toast.success('User updated successfully!');
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
      toast.success('User deleted successfully!');
    }
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, enabled: !user.enabled } : user
    ));
    const user = users.find(u => u.id === id);
    toast.success(`${user?.fullName} ${user?.enabled ? 'disabled' : 'enabled'} successfully!`);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    const roleData = roleOptions.find(r => r.label === role);
    const Icon = roleData?.icon || Users;
    return Icon;
  };

  const getRoleColor = (role) => {
    const roleData = roleOptions.find(r => r.label === role);
    return roleData?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            setPasswordMethod('auto');
            setFormData({ username: '', fullName: '', email: '', role: 'teacher', password: '', confirmPassword: '' });
            setShowAddModal(true);
          }}
          className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search users by name, username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <RoleIcon size={12} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                          user.enabled 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {user.enabled ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetModal(true);
                          }}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Password Options */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Setup</label>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setPasswordMethod('auto')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                      passwordMethod === 'auto' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Mail size={16} className="inline mr-1" /> Auto-generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMethod('manual')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                      passwordMethod === 'manual' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Key size={16} className="inline mr-1" /> Set Manually
                  </button>
                </div>

                {passwordMethod === 'manual' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 pr-10"
                          placeholder="Enter password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                )}

                {passwordMethod === 'auto' && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                    <Mail size={16} className="inline mr-2" />
                    A temporary password will be generated and shown after creation.
                  </div>
                )}
              </div>

              <button
                onClick={handleAddUser}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition mt-2"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="text-center">
              <Key size={48} className="text-orange-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-2">
                Reset password for <strong>{selectedUser.fullName}</strong>?
              </p>
              <p className="text-gray-500 text-sm mb-4">
                A new temporary password will be generated.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleResetPassword} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition">
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={formData.username} disabled className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleUpdateUser} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}