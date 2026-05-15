import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../../components/settings';

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const adminData = {
    fullName: user?.fullName || 'Admin User',
    email: user?.email || 'admin@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'admin',  // This is critical - must be 'admin'
    address: 'Patubig, Marilao, Bulacan',
    bio: 'System Administrator for ReBot Program'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return <Settings userRole="admin" userData={adminData} onLogout={handleLogout} />;
}