import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = ({ user, logout }) => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, rewardsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/users'),
        axios.get('/api/rewards')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">♻️</div>
            <div>
              <div>ReBot</div>
              <div className="school-badge">Patubig ES</div>
            </div>
          </div>
        </div>
        <div className="nav-menu">
          <div className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <i className="fas fa-chart-line"></i><span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeSection === 'users' ? 'active' : ''}`} onClick={() => setActiveSection('users')}>
            <i className="fas fa-users"></i><span>User Management</span>
          </div>
          {/* More nav items */}
          <div className="nav-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i><span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeSection === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalBottles || 0}</div>
                <div className="stat-label">Total Bottles</div>
              </div>
              {/* More stats */}
            </div>
            {/* Charts and tables */}
          </div>
        )}
        
        {activeSection === 'users' && (
          <div>
            <h2>User Management</h2>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.fullname}</td>
                    <td>{user.role}</td>
                    <td>{user.enabled ? 'Active' : 'Disabled'}</td>
                    <td>
                      <button>Edit</button>
                      <button>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;