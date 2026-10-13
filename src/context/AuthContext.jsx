import { createContext, useState, useEffect } from 'react';
import usersData from '../data/users.json';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('dashboard_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('dashboard_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (employeeId, password) => {
    const foundUser = usersData.find(
      u => u.employeeId === employeeId && u.password === password
    );
    
    if (foundUser) {
      const userData = { ...foundUser };
      delete userData.password;
      setUser(userData);
      localStorage.setItem('dashboard_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    
    // Check if employee ID exists
    const userExists = usersData.find(u => u.employeeId === employeeId);
    if (!userExists) {
      return { success: false, error: 'Employee ID not found. Please check your credentials.' };
    }
    return { success: false, error: 'Incorrect password. Please try again.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dashboard_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
