import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Search, UserCheck, UserX, Shield, 
  BookOpen, Coffee, Recycle, X, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const roleOptions = [
  { value: 'teacher', label: 'Teacher', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  { value: 'canteen_staff', label: 'Canteen Staff', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
  { value: 'junk_shop_personnel', label: 'Junk Shop', icon: Recycle, color: 'bg-green-100 text-green-700' },
  { value: 'administrator', label: 'Administrator', icon: Shield, color: 'bg-purple-100 text-purple-700' }
];

const availableGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedGrades, setAssignedGrades] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'teacher',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Users fetched:', data);
      
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.fullName || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    const finalPassword = generateRandomPassword();
    
    const userData = {
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      password: finalPassword,
      isActive: true
    };
    
    if (formData.role === 'teacher' && assignedGrades.length > 0) {
      userData.assignedGrades = assignedGrades;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const roleInfo = roleOptions.find(r => r.value === formData.role);
        const gradeMessage = formData.role === 'teacher' && assignedGrades.length > 0 
          ? `\n📚 Assigned Grades: ${assignedGrades.join(', ')}` 
          : '';
        
        alert(`✅ USER CREATED SUCCESSFULLY!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 USER DETAILS:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Username: ${formData.username}\n🔑 Password: ${finalPassword}\n👔 Role: ${roleInfo?.label || formData.role}${gradeMessage}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ Please save this password and share it with the user.`);
        
        toast.success(`User ${formData.username} created successfully!`);
        
        setShowAddModal(false);
        setFormData({ username: '', fullName: '', email: '', role: 'teacher', password: '', confirmPassword: '' });
        setAssignedGrades([]);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to add user');
    }
  };

  const handleUpdateUser = async () => {
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill required fields');
      return;
    }

    const updateData = {
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role
    };
    
    if (formData.role === 'teacher') {
      updateData.assignedGrades = assignedGrades;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('User updated successfully!');
        setShowEditModal(false);
        setEditingUser(null);
        setAssignedGrades([]);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('User deleted successfully!');
          fetchUsers();
        } else {
          toast.error(data.message || 'Failed to delete user');
        }
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`User ${currentStatus ? 'disabled' : 'enabled'} successfully!`);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to toggle user status');
      }
    } catch (error) {
      toast.error('Failed to toggle user status');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name?.toLowerCase().replace(' ', '_') || 'teacher',
      password: '',
      confirmPassword: ''
    });
    setAssignedGrades(user.assignedGrades || []);
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (roleName) => {
    if (!roleName) return Users;
    if (roleName === 'administrator') return Shield;
    if (roleName === 'teacher') return BookOpen;
    if (roleName === 'canteen_staff') return Coffee;
    if (roleName === 'junk_shop_personnel') return Recycle;
    return Users;
  };

  const getRoleColor = (roleName) => {
    if (!roleName) return 'bg-gray-100 text-gray-700';
    if (roleName === 'administrator') return 'bg-purple-100 text-purple-700';
    if (roleName === 'teacher') return 'bg-blue-100 text-blue-700';
    if (roleName === 'canteen_staff') return 'bg-orange-100 text-orange-700';
    if (roleName === 'junk_shop_personnel') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getRoleDisplayName = (roleName) => {
    if (roleName === 'administrator') return 'Admin';
    if (roleName === 'canteen_staff') return 'Canteen';
    if (roleName === 'junk_shop_personnel') return 'Junk Shop';
    if (roleName === 'teacher') return 'Teacher';
    return roleName || 'Unknown';
  };

  const getAssignedGradesDisplay = (user) => {
    if (user.role?.name !== 'teacher') return '-';
    if (!user.assignedGrades || user.assignedGrades.length === 0) return 'All Grades';
    return user.assignedGrades.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and their role assignments</p>
        </div>
        <button
          onClick={() => {
            setFormData({ username: '', fullName: '', email: '', role: 'teacher', password: '', confirmPassword: '' });
            setAssignedGrades([]);
            setShowAddModal(true);
          }}
          className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Grades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role?.name);
                return (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role?.name)}`}>
                        <RoleIcon size={12} />
                        {getRoleDisplayName(user.role?.name)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getAssignedGradesDisplay(user)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {user.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter username (no spaces)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    if (e.target.value !== 'teacher') {
                      setAssignedGrades([]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {formData.role === 'teacher' && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📚 Assign Grade Levels (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select which grade levels this teacher can access.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableGrades.map(grade => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => {
                          if (assignedGrades.includes(grade)) {
                            setAssignedGrades(assignedGrades.filter(g => g !== grade));
                          } else {
                            setAssignedGrades([...assignedGrades, grade]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          assignedGrades.includes(grade)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    {assignedGrades.length === 0 ? (
                      <p className="text-xs text-blue-700">⚠️ Teacher will see ALL grades</p>
                    ) : (
                      <p className="text-xs text-green-700">✅ Teacher will ONLY see: <strong>{assignedGrades.join(', ')}</strong></p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                <Mail size={16} className="inline mr-2" />
                A secure temporary password will be generated automatically.
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
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
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    if (e.target.value !== 'teacher') {
                      setAssignedGrades([]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {formData.role === 'teacher' && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📚 Assigned Grade Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {availableGrades.map(grade => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => {
                          if (assignedGrades.includes(grade)) {
                            setAssignedGrades(assignedGrades.filter(g => g !== grade));
                          } else {
                            setAssignedGrades([...assignedGrades, grade]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          assignedGrades.includes(grade)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUpdateUser}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}