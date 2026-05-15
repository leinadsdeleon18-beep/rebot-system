import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../../components/settings';

export default function CanteenSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const canteenData = {
    fullName: user?.fullName || 'Canteen Staff',
    email: user?.email || 'canteen@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'canteen',
    address: 'Patubig, Marilao, Bulacan',
    bio: 'Canteen Staff for ReBot Program'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return <Settings userRole="canteen" userData={canteenData} onLogout={handleLogout} />;
}