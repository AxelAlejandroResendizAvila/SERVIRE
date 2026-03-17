// Frontend API Calls

const BASE_URL = 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('servire_token'); // Simplified token retrieval
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Auth
export const login = async (email, contrasena) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contrasena })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
};

export const register = async (userData) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');
    return data;
};

export const getSpaces = async () => {
    try {
        const res = await fetch(`${BASE_URL}/espacios`);
        if (!res.ok) throw new Error('Network response was not ok');
        return await res.json();
    } catch (e) {
        console.error(e);
        return []; // Return empty array on fail conceptually to not crash UI
    }
};

export const reserveSpace = async (spaceId, userId = 'mockUser123') => {
    // En mundo real, userId vendrá del token decodificado en backend
    try {
        const res = await fetch(`${BASE_URL}/reservas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                id_espacio: spaceId,
                precio_total: 0 // Mock price
            })
        });
        return await res.json();
    } catch (e) {
        console.error(e);
        return { success: false };
    }
};

export const joinWaitlist = async (spaceId, userId) => {
    // In our backend logic, joinWaitlist is handled by the exact same reservation endpoint 
    // but depends on the availability status of the space internally.
    return reserveSpace(spaceId, userId);
};

export const getAdminRequests = async () => {
    try {
        const res = await fetch(`${BASE_URL}/reservas/admin`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Fail');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getMyReservations = async () => {
    try {
        const res = await fetch(`${BASE_URL}/reservas/mis-reservas`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Fail');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};
