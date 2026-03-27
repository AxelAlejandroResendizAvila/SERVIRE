import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('servire_token');
            if (token) {
                try {
                    const data = await getMe();
                    setUser(data.usuario);
                } catch (error) {
                    localStorage.removeItem('servire_token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const data = await loginApi(email, password);
            localStorage.setItem('servire_token', data.token);
            setUser(data.usuario);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const data = await registerApi(userData);
            localStorage.setItem('servire_token', data.token);
            setUser(data.usuario);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('servire_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
