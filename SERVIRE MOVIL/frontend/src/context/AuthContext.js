import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, removeToken, saveToken, authLogin as apiAuthLogin, authRegister as apiAuthRegister } from '../services/api';
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
          const response = await axios.get(`${config.baseURL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.usuario);
        }
      } catch (error) {
        // Silenciar error de verificación de token (esperado si no hay token)
        if (error.response?.status !== 401) {
          console.log('No autenticado');
        }
        await removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiAuthLogin(email, password);
      const { usuario, token } = response;
      
      setUser(usuario);
      return response;
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Datos inválidos';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      const customError = new Error(errorMessage);
      throw customError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nombre, apellidos, email, password, telefono = '') => {
    try {
      setLoading(true);
      const response = await apiAuthRegister({
        nombre,
        apellidos,
        email,
        contrasena: password,
        telefono,
      });

      const { usuario } = response;
      setUser(usuario);
      return response;
    } catch (error) {
      let errorMessage = 'Error al registrarse';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Datos inválidos. Verifica que el correo no esté registrado';
        } else if (error.response.status === 409) {
          errorMessage = 'Este correo ya está registrado';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      const customError = new Error(errorMessage);
      throw customError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
    } catch (error) {
      // Error silenciado
    }
  };

  const changePassword = async (passwordActual, passwordNueva) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.post(`${config.baseURL}/auth/change-password`, {
        passwordActual,
        passwordNueva,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (nombre, telefono) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.put(`${config.baseURL}/auth/update-profile`, {
        nombre,
        telefono,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.usuario);
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
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
