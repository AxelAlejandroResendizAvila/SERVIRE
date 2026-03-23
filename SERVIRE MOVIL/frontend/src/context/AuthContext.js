import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, removeToken, saveToken } from '../services/api';
import axios from 'axios';
import { config } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un token guardado al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          // Obtener datos del usuario
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${config.baseURL}/auth/login`, {
        email,
        contrasena: password,
      });

      const { token, usuario } = response.data;

      // Guardar token y datos del usuario
      await saveToken(token);
      await AsyncStorage.setItem('userData', JSON.stringify(usuario));

      setUser(usuario);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nombre, email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${config.baseURL}/auth/register`, {
        nombre,
        email,
        contrasena: password,
      });

      const { token, usuario } = response.data;

      // Guardar token y datos del usuario
      await saveToken(token);
      await AsyncStorage.setItem('userData', JSON.stringify(usuario));

      setUser(usuario);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const changePassword = async (passwordActual, passwordNueva) => {
    try {
      setLoading(true);
      const response = await axios.post(`${config.baseURL}/auth/change-password`, {
        id_usuario: user.id,
        passwordActual,
        passwordNueva,
      });

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
