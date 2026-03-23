import { useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';
import { getToken } from '../services/api';

export const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        setError('No autenticado');
        return;
      }

      const response = await axios.get(`${config.baseURL}/reservas/mis-reservas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReservations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    reservations,
    loading,
    error,
    refetch: fetchReservations,
  };
};
