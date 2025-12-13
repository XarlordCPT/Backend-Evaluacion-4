import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getAccessToken();
      if (token) {
        setIsAuthenticated(true);
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            username: payload.username,
            rol: payload.rol,
            rut: payload.rut,
          });
        } catch (error) {
          console.error('Error al decodificar token:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const data = await authService.login(username, password);
      
      const payload = JSON.parse(atob(data.access.split('.')[1]));
      const userData = {
        username: payload.username,
        rol: payload.rol,
        rut: payload.rut,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

