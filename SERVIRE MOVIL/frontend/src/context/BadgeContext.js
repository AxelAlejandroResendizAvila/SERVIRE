import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BadgeContext = createContext();

export const BadgeProvider = ({ children }) => {
    const [hasChangedReservations, setHasChangedReservations] = useState(false);

    const checkReservationChanges = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('reservationChanges');
            setHasChangedReservations(stored === 'true');
        } catch (e) {
            console.warn('Error checking reservation changes:', e);
        }
    }, []);

    const clearBadge = useCallback(async () => {
        try {
            await AsyncStorage.setItem('reservationChanges', 'false');
            setHasChangedReservations(false);
        } catch (e) {
            console.warn('Error clearing badge:', e);
        }
    }, []);

    return (
        <BadgeContext.Provider value={{ hasChangedReservations, checkReservationChanges, clearBadge }}>
            {children}
        </BadgeContext.Provider>
    );
};

export const useBadge = () => {
    const context = useContext(BadgeContext);
    if (!context) {
        throw new Error('useBadge must be used within BadgeProvider');
    }
    return context;
};
