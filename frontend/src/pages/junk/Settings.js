import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../../components/settings';

export default function JunkSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const junkData = {
    fullName: user?.fullName || 'Junk Shop Staff',
    email: user?.email || 'junk@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'junk',
    address: 'Patubig, Marilao, Bulacan',
    bio: 'Junk Shop Personnel for ReBot Program'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return <Settings userRole="junk" userData={junkData} onLogout={handleLogout} />;
}