import React, { createContext, useContext, useState } from 'react';
import { Toast } from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'error', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const error = (message, duration = 4000) => showToast(message, 'error', duration);
  const success = (message, duration = 4000) => showToast(message, 'success', duration);
  const warning = (message, duration = 4000) => showToast(message, 'warning', duration);
  const info = (message, duration = 4000) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ showToast, error, success, warning, info }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};
