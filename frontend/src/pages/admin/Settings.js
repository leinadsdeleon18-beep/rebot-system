import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../../components/settings';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [editingReward, setEditingReward] = useState(null);
  const [editingPoints, setEditingPoints] = useState('');
  
  const adminData = {
    fullName: user?.fullName || 'Admin User',
    email: user?.email || 'admin@rebot.ph',
    phone: '+63 912 345 6789',
    role: 'admin',
    address: 'Patubig, Marilao, Bulacan',
    bio: 'System Administrator for ReBot Program'
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch rewards on component mount
  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching rewards from API...');
      const response = await fetch('http://localhost:5000/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Rewards API response:', data);
      
      if (data.success) {
        setRewards(data.rewards);
        console.log('Rewards loaded:', data.rewards.length);
      } else {
        console.error('Failed to load rewards:', data.message);
        toast.error(data.message || 'Failed to load rewards');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleUpdatePoints = async (rewardId, newPoints) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rewards/${rewardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pointsRequired: parseInt(newPoints) })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Points updated successfully!');
        fetchRewards(); // Refresh the list
        setEditingReward(null);
        setEditingPoints('');
      } else {
        toast.error(data.message || 'Failed to update points');
      }
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Failed to update points');
    }
  };

  const startEditing = (reward) => {
    if (reward && reward._id) {
      setEditingReward(reward._id);
      setEditingPoints(reward.pointsRequired.toString());
    }
  };

  const cancelEditing = () => {
    setEditingReward(null);
    setEditingPoints('');
  };

  // Custom props to pass to Settings component
  const customSettingsProps = {
    rewards,
    loadingRewards,
    editingReward,
    editingPoints,
    setEditingPoints,
    startEditing,
    cancelEditing,
    handleUpdatePoints,
    fetchRewards
  };

  return (
    <Settings 
      userRole="admin" 
      userData={adminData} 
      onLogout={handleLogout}
      customProps={customSettingsProps}
    />
  );
}