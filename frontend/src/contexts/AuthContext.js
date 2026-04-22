import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('rebot_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('rebot_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const demoUsers = {
        admin123: { id: 1, username: 'admin123', fullName: 'Admin User', email: 'admin@rebot.ph', role: 'admin', password: 'admin123' },
        teacher123: { id: 2, username: 'teacher123', fullName: 'Maria Santos', email: 'teacher@rebot.ph', role: 'teacher', password: 'teacher123' },
        canteen123: { id: 3, username: 'canteen123', fullName: 'Rosa Mercado', email: 'canteen@rebot.ph', role: 'canteen', password: 'canteen123' },
        junk123: { id: 4, username: 'junk123', fullName: 'Juan Reyes', email: 'junk@rebot.ph', role: 'junk', password: 'junk123' },
        utility123: { id: 6, username: 'utility123', fullName: 'Utility Staff', email: 'utility@rebot.ph', role: 'utility', password: 'utility123' }
      };

      const foundUser = demoUsers[username];
      if (foundUser && foundUser.password === password) {
        const { password: _, ...userWithoutPassword } = foundUser;
        
        localStorage.setItem('rebot_user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        
        toast.success(`Welcome back, ${userWithoutPassword.fullName}!`);
        return { success: true, user: userWithoutPassword };
      } else {
        toast.error('Invalid username or password');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      toast.error('Login failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('rebot_user');
    setUser(null);
    
    // FORCE LIGHT MODE ON LOGOUT - Reset everything
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    
    // Force page reload to ensure clean state
    window.location.href = '/';
    
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isCanteen: user?.role === 'canteen',
    isJunk: user?.role === 'junk',
    isStudent: user?.role === 'student',
    isUtility: user?.role === 'utility'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};