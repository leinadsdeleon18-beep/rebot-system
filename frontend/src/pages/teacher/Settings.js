import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../../components/settings';

export default function TeacherSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const teacherData = {
    fullName: user?.fullName || 'Teacher',
    email: user?.email || 'teacher@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'teacher',
    address: 'Patubig, Marilao, Bulacan',
    bio: 'Teacher for ReBot Program'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return <Settings userRole="teacher" userData={teacherData} onLogout={handleLogout} />;
}