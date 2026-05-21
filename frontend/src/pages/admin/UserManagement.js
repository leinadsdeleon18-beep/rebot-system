import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Search, X, RefreshCw, AlertCircle, Eye, EyeOff,
  UserCheck, UserX, Shield, UserCog, BookOpen, Copy, Check, Key,
  Mail, Award, Save, UserPlus, Settings, GraduationCap, Sparkles,
  Lock, Filter, ArrowUpDown, CheckCircle, XCircle, Briefcase, Globe,
  Crown, Calendar, Clock, MoreVertical, Trash2, School, Building2,
  UserCircle, AtSign, Mail as MailIcon, Phone, MapPin, BadgeCheck,
  Star, Trophy, Zap, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const Coffee = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
    <line x1="6" y1="2" x2="6" y2="4"/>
    <line x1="10" y1="2" x2="10" y2="4"/>
    <line x1="14" y1="2" x2="14" y2="4"/>
  </svg>
);

const RecycleIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
    <path d="m14 16-3 3 3 3"/>
    <path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
    <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
    <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
  </svg>
);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredSections, setFilteredSections] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: '',
    assignedGrades: [],
    assignedSections: []
  });
  
  const gradeLevels = [
    { code: 'K', name: 'Kindergarten' },
    { code: 'G1', name: 'Grade 1' },
    { code: 'G2', name: 'Grade 2' },
    { code: 'G3', name: 'Grade 3' },
    { code: 'G4', name: 'Grade 4' },
    { code: 'G5', name: 'Grade 5' },
    { code: 'G6', name: 'Grade 6' }
  ];

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const handleOpenAddModal = () => {
    setGeneratedPassword(generateRandomPassword());
    setFormData({
      username: '',
      fullName: '',
      email: '',
      role: '',
      assignedGrades: [],
      assignedSections: []
    });
    setFilteredSections([]);
    setShowAddModal(true);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setPasswordCopied(true);
    toast.success('Password copied!');
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const regeneratePassword = () => {
    setGeneratedPassword(generateRandomPassword());
    setPasswordCopied(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchSections();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
      else toast.error(data.message || 'Failed to load users');
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setRoles(data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
        setFilteredSections(data.sections);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.fullName || !formData.email || !formData.role) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const selectedRole = roles.find(r => r._id === formData.role);
      const roleName = selectedRole ? selectedRole.name : formData.role;
      
      const fullGradeNames = formData.assignedGrades.map(code => {
        const grade = gradeLevels.find(g => g.code === code);
        return grade ? grade.name : code;
      });
      
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          password: generatedPassword,
          role: roleName,
          assignedGrades: fullGradeNames,
          assignedSections: formData.assignedSections
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`${formData.fullName} added successfully!`);
        toast(`🔑 Username: ${formData.username} | Password: ${generatedPassword}`, { duration: 8000 });
        setShowAddModal(false);
        setFormData({ username: '', fullName: '', email: '', role: '', assignedGrades: [], assignedSections: [] });
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!formData.fullName) {
      toast.error('Full name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const fullGradeNames = formData.assignedGrades.map(code => {
        const grade = gradeLevels.find(g => g.code === code);
        return grade ? grade.name : code;
      });
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          fullName: formData.fullName,
          assignedGrades: fullGradeNames,
          assignedSections: formData.assignedSections
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('User updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.isActive;
    setTogglingUserId(user._id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${user._id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`${user.fullName} ${newStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setTogglingUserId(null);
    }
  };

  const openEditModal = (user) => {
    const assignedGradeCodes = (user.assignedGrades || []).map(gradeName => {
      const grade = gradeLevels.find(g => g.name === gradeName);
      return grade ? grade.code : gradeName;
    });
    
    let sectionsToShow = sections;
    if (assignedGradeCodes.length > 0) {
      const selectedGradeNames = assignedGradeCodes.map(code => {
        const grade = gradeLevels.find(g => g.code === code);
        return grade ? grade.name : code;
      });
      sectionsToShow = sections.filter(section => selectedGradeNames.includes(section.gradeLevel));
    }
    
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name || '',
      assignedGrades: assignedGradeCodes,
      assignedSections: user.assignedSections || []
    });
    setFilteredSections(sectionsToShow);
    setShowEditModal(true);
  };

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'administrator': return <Crown size={16} className="text-purple-500" />;
      case 'teacher': return <GraduationCap size={16} className="text-blue-500" />;
      case 'canteen_staff': return <Coffee size={16} className="text-orange-500" />;
      case 'junk_shop_personnel': return <RecycleIcon size={16} className="text-green-500" />;
      default: return <UserCog size={16} className="text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'administrator': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'teacher': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'canteen_staff': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'junk_shop_personnel': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const handleGradeChange = (gradeCode) => {
    setFormData(prev => {
      const newGrades = prev.assignedGrades.includes(gradeCode)
        ? prev.assignedGrades.filter(g => g !== gradeCode)
        : [...prev.assignedGrades, gradeCode];
      
      let newFilteredSections = sections;
      if (newGrades.length > 0) {
        const selectedGradeNames = newGrades.map(code => {
          const grade = gradeLevels.find(g => g.code === code);
          return grade ? grade.name : code;
        });
        newFilteredSections = sections.filter(section => selectedGradeNames.includes(section.gradeLevel));
      } else {
        newFilteredSections = sections;
      }
      
      setFilteredSections(newFilteredSections);
      
      const validSectionIds = newFilteredSections.map(s => s._id);
      const updatedSections = prev.assignedSections.filter(id => validSectionIds.includes(id));
      
      return {
        ...prev,
        assignedGrades: newGrades,
        assignedSections: updatedSections
      };
    });
  };

  const handleSectionChange = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      assignedSections: prev.assignedSections.includes(sectionId)
        ? prev.assignedSections.filter(id => id !== sectionId)
        : [...prev.assignedSections, sectionId]
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive !== false) ||
      (statusFilter === 'disabled' && user.isActive === false);
    const matchesRole = roleFilter === 'all' || user.role?.name === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const activeCount = users.filter(u => u.isActive !== false).length;
  const disabledCount = users.filter(u => u.isActive === false).length;
  const adminCount = users.filter(u => u.role?.name === 'administrator').length;
  const teacherCount = users.filter(u => u.role?.name === 'teacher').length;
  const uniqueRoles = ['all', ...new Set(users.map(u => u.role?.name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users size={18} className="text-green-500" />
          </div>
        </div>
        <p className="text-sm text-gray-500">Loading users...</p>
      </div>
    );
  }

  const isTeacherRole = formData.role && roles.find(r => r._id === formData.role)?.name === 'teacher';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            </div>
            <p className="text-sm text-gray-500 ml-12">Manage system users, roles, and access permissions</p>
          </div>
          <button 
            onClick={handleOpenAddModal} 
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus size={18} /> Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Users size={22} className="text-blue-500" />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-500 mt-1">System Users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <UserCheck size={22} className="text-green-500" />
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500 mt-1">Active Accounts</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <UserX size={22} className="text-red-500" />
              <span className="text-xs text-gray-400">Disabled</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{disabledCount}</p>
            <p className="text-xs text-gray-500 mt-1">Disabled Accounts</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <Crown size={22} className="text-purple-500" />
              <span className="text-xs text-gray-400">Admins</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
            <p className="text-xs text-gray-500 mt-1">Administrators</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap size={22} className="text-orange-500" />
              <span className="text-xs text-gray-400">Teachers</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{teacherCount}</p>
            <p className="text-xs text-gray-500 mt-1">Faculty Members</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role.replace('_', ' ').charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all'); }}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-1"
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">User</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Username</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Role</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Access</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isDisabled = user.isActive === false;
                  const isTeacher = user.role?.name === 'teacher';
                  const isToggling = togglingUserId === user._id;
                  
                  return (
                    <tr key={user._id} className={`hover:bg-gray-50 transition ${isDisabled ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            user.role?.name === 'administrator' ? 'bg-purple-500' :
                            user.role?.name === 'teacher' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {getInitials(user.fullName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.fullName}</p>
                            <p className="text-xs text-gray-400">ID: {user._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-xs">
                          @{user.username || 'unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{user.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role?.name)}`}>
                          {getRoleIcon(user.role?.name)} {user.role?.name?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {isTeacher ? (
                          <div className="flex items-center gap-1">
                            {user.assignedSections?.length > 0 ? (
                              <>
                                <Building2 size={12} className="text-green-500" />
                                <span className="text-xs">{user.assignedSections.length} Sections</span>
                              </>
                            ) : user.assignedGrades?.length > 0 ? (
                              <>
                                <School size={12} className="text-blue-500" />
                                <span className="text-xs">{user.assignedGrades.length} Grades</span>
                              </>
                            ) : (
                              <span className="text-xs text-green-600 font-medium">Full Access</span>
                            )}
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          isDisabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {isDisabled ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          {isDisabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={isDisabled}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={isToggling}
                            className={`relative w-9 h-5 rounded-full transition-all ${isDisabled ? 'bg-gray-300' : 'bg-green-500'}`}
                          >
                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${isDisabled ? 'left-0.5' : 'left-5'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={40} className="text-gray-300" />
                        <p className="text-gray-500">No users found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slideUp">
              <div className="flex h-full">
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <UserPlus size={18} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-10">Create a new system account with role-based permissions</p>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="john_doe"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MailIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="john@school.edu"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Key size={14} className="text-blue-600" />
                        Generated Password
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={generatedPassword}
                            readOnly
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          onClick={copyPasswordToClipboard}
                          className="px-4 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition"
                        >
                          {passwordCopied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={regeneratePassword}
                          className="px-4 py-2.5 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Share this password with the user. They can change it later.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role._id} value={role._id}>
                            {role.name === 'administrator' ? 'Administrator' : 
                             role.name === 'teacher' ? 'Teacher' : 
                             role.name === 'canteen_staff' ? 'Canteen Staff' : 
                             role.name === 'junk_shop_personnel' ? 'Junk Shop Personnel' : role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 pt-5 border-t border-gray-100">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={handleAddUser} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 shadow-md">
                      {isSubmitting ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>

                {isTeacherRole && (
                  <div className="w-96 bg-gray-50 border-l border-gray-100 p-6 overflow-y-auto">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Teacher Access Settings</h4>
                          <p className="text-xs text-gray-500">Configure grade and section permissions</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-600 mb-3">Assigned Grade Levels</label>
                        <div className="grid grid-cols-2 gap-2">
                          {gradeLevels.map(grade => (
                            <button
                              key={grade.code}
                              onClick={() => handleGradeChange(grade.code)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                formData.assignedGrades.includes(grade.code)
                                  ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{grade.name}</span>
                              {formData.assignedGrades.includes(grade.code) && <CheckCircle size={14} />}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                          <AlertCircle size={12} /> Leave all unchecked = Access to all grades
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-3">
                          Assigned Sections 
                          {formData.assignedGrades.length > 0 && (
                            <span className="text-xs text-blue-600 ml-2">(Filtered by selected grades)</span>
                          )}
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {filteredSections.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                              <Building2 size={32} className="text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400">No sections available for selected grades</p>
                              {formData.assignedGrades.length === 0 && (
                                <p className="text-xs text-gray-400 mt-1">Select grades first to filter sections</p>
                              )}
                            </div>
                          ) : (
                            filteredSections.map(section => (
                              <label
                                key={section._id}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  formData.assignedSections.includes(section._id)
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.assignedSections.includes(section._id)}
                                  onChange={() => handleSectionChange(section._id)}
                                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{section.sectionName}</p>
                                  <p className="text-xs text-gray-400">{section.gradeLevel}</p>
                                </div>
                                <School size={14} className="text-gray-300" />
                              </label>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                          <BadgeCheck size={12} /> Section access takes precedence over grade assignment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slideUp">
              <div className="flex h-full">
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Settings size={18} className="text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-10">Update user information and permissions</p>
                    </div>
                    <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md ${
                      selectedUser.role?.name === 'administrator' ? 'bg-purple-500' :
                      selectedUser.role?.name === 'teacher' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {getInitials(selectedUser.fullName)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{selectedUser.fullName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(selectedUser.role?.name)}`}>
                          {getRoleIcon(selectedUser.role?.name)} {selectedUser.role?.name?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                      <div className="relative">
                        <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.username}
                          disabled
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Lock size={12} /> Username cannot be changed
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <MailIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Lock size={12} /> Email cannot be changed for security
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${getRoleBadgeClass(formData.role)}`}>
                        {getRoleIcon(formData.role)}
                        <span className="font-medium">{formData.role?.replace('_', ' ') || 'Unknown'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Lock size={12} /> Role cannot be changed. Contact super admin for role changes.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 pt-5 border-t border-gray-100">
                    <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={handleUpdateUser} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 shadow-md">
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {formData.role === 'teacher' && (
                  <div className="w-96 bg-gray-50 border-l border-gray-100 p-6 overflow-y-auto">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Teacher Access Settings</h4>
                          <p className="text-xs text-gray-500">Configure grade and section permissions</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-600 mb-3">Assigned Grade Levels</label>
                        <div className="grid grid-cols-2 gap-2">
                          {gradeLevels.map(grade => (
                            <button
                              key={grade.code}
                              onClick={() => handleGradeChange(grade.code)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                formData.assignedGrades.includes(grade.code)
                                  ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{grade.name}</span>
                              {formData.assignedGrades.includes(grade.code) && <CheckCircle size={14} />}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                          <AlertCircle size={12} /> Leave all unchecked = Access to all grades
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-3">
                          Assigned Sections 
                          {formData.assignedGrades.length > 0 && (
                            <span className="text-xs text-blue-600 ml-2">(Filtered by selected grades)</span>
                          )}
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {filteredSections.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                              <Building2 size={32} className="text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400">No sections available for selected grades</p>
                              {formData.assignedGrades.length === 0 && (
                                <p className="text-xs text-gray-400 mt-1">Select grades first to filter sections</p>
                              )}
                            </div>
                          ) : (
                            filteredSections.map(section => (
                              <label
                                key={section._id}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  formData.assignedSections.includes(section._id)
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.assignedSections.includes(section._id)}
                                  onChange={() => handleSectionChange(section._id)}
                                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{section.sectionName}</p>
                                  <p className="text-xs text-gray-400">{section.gradeLevel}</p>
                                </div>
                                <School size={14} className="text-gray-300" />
                              </label>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                          <BadgeCheck size={12} /> Section access takes precedence over grade assignment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}