import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    // Check if we're on landing page by looking at the URL
    const isLandingPage = window.location.pathname === '/' || window.location.pathname === '/login';
    // Don't apply dark mode on landing page
    if (isLandingPage) return false;
    return saved === 'true';
  });

  // Function to check if current page is landing page
  const isLandingPage = () => {
    return window.location.pathname === '/' || window.location.pathname === '/login';
  };

  useEffect(() => {
    // NEVER apply dark mode on landing page
    if (isLandingPage()) {
      document.documentElement.classList.remove('dark');
      return;
    }
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Listen for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (isLandingPage()) {
        // Force remove dark class on landing page
        document.documentElement.classList.remove('dark');
      } else {
        // Apply saved theme on dashboards
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    // Initial check
    handleRouteChange();

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const toggleDarkMode = () => {
    // Don't allow toggling dark mode on landing page
    if (isLandingPage()) return;
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};