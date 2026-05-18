import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/apiService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('rebot_user');
      
      console.log('AuthContext - Checking localStorage');
      console.log('Token exists:', !!token);
      console.log('Stored user:', storedUser);
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('AuthContext - User restored:', parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('rebot_user');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('rebot_user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('AuthContext - Login successful, user set:', userData);
      
      toast.success(`Welcome back, ${userData.fullName}!`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    localStorage.removeItem('token');
    localStorage.removeItem('rebot_user');
    setUser(null);
    toast.success('Logged out successfully');
    setLoading(false);
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'administrator',
    isTeacher: user?.role === 'teacher',
    isCanteen: user?.role === 'canteen_staff',
    isJunk: user?.role === 'junk_shop_personnel',
    isUtility: user?.role === 'utility_staff'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};