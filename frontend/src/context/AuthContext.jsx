import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('uacs_token');
    if (token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });
        const data = await response.json();
        
        if (response.ok && data) {
          setUser(data);
          localStorage.setItem('uacs_user', JSON.stringify(data));
          if (data.zone) localStorage.setItem('uacs_pref_zone', data.zone);
          if (data.language) localStorage.setItem('uacs_pref_lang', data.language);
        } else {
          // Token invalid or expired
          localStorage.removeItem('uacs_token');
          localStorage.removeItem('uacs_user');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
