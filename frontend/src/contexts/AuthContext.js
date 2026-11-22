import React, { createContext, useCallback, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/apiService';
import { setAuthSession } from '../services/authSession';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    setAuthSession(null, null);
    setUser(null);
  }, []);

  useEffect(() => {
    // Remove credentials saved by earlier releases.
    try {
      for (const key of ['token', 'rebot_token', 'rebot_user']) localStorage.removeItem(key);
    } catch {
      // Browser storage is optional for sign-in.
    }

    const handlePageShow = (event) => {
      if (event.persisted) clearSession();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [clearSession]);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;

      setAuthSession(token, userData);
      setUser(userData);

      toast.success(`Welcome back, ${userData.fullName}!`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || (
        error.response
          ? 'Login failed'
          : 'Unable to reach the server. Please check your connection and try again.'
      );
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearSession();
    toast.success('Logged out successfully');
  };

  const roleName = user?.roleName || user?.role;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      clearSession,
      isAuthenticated: !!user,
      isAdmin: roleName === 'administrator',
      isTeacher: roleName === 'teacher',
      isCanteen: roleName === 'canteen_staff',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
