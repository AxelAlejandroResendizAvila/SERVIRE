// Frontend API Calls — SERVIRE Admin Desktop

const BASE_URL = 'http://localhost:3000/api';

// Helper to get auth headers (JSON)
const getAuthHeaders = () => {
    const token = localStorage.getItem('servire_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Helper for auth with FormData (no Content-Type — browser sets it with boundary)
const getAuthHeadersMultipart = () => {
    const token = localStorage.getItem('servire_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ─── Auth ──────────────────────────────────────────────────────────────
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

// ─── Spaces ────────────────────────────────────────────────────────────
export const getSpaces = async () => {
    try {
        const res = await fetch(`${BASE_URL}/espacios`);
        if (!res.ok) throw new Error('Network response was not ok');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getSpaceDetail = async (spaceId) => {
    const res = await fetch(`${BASE_URL}/espacios/${spaceId}`);
    if (!res.ok) throw new Error('Error al obtener detalle del espacio');
    return await res.json();
};

export const getCategories = async () => {
    try {
        const res = await fetch(`${BASE_URL}/espacios/categorias`);
        if (!res.ok) throw new Error('Network response was not ok');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const createSpace = async (formData) => {
    // formData should be a FormData object (for file uploads)
    const res = await fetch(`${BASE_URL}/espacios`, {
        method: 'POST',
        headers: getAuthHeadersMultipart(),
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear espacio');
    return data;
};

export const updateSpace = async (spaceId, formData) => {
    const res = await fetch(`${BASE_URL}/espacios/${spaceId}`, {
        method: 'PUT',
        headers: getAuthHeadersMultipart(),
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar espacio');
    return data;
};

export const deleteSpace = async (spaceId) => {
    const res = await fetch(`${BASE_URL}/espacios/${spaceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar espacio');
    return data;
};

export const deleteGalleryImage = async (imageId) => {
    const res = await fetch(`${BASE_URL}/espacios/imagen/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar imagen');
    return data;
};

// ─── Reservations ──────────────────────────────────────────────────────
export const reserveSpace = async (spaceId) => {
    try {
        const res = await fetch(`${BASE_URL}/reservas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id_espacio: spaceId })
        });
        return await res.json();
    } catch (e) {
        console.error(e);
        return { success: false };
    }
};

export const joinWaitlist = async (spaceId) => {
    return reserveSpace(spaceId);
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

export const approveReservation = async (reservationId) => {
    const res = await fetch(`${BASE_URL}/reservas/${reservationId}/aprobar`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al aprobar');
    return data;
};

export const declineReservation = async (reservationId) => {
    const res = await fetch(`${BASE_URL}/reservas/${reservationId}/rechazar`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al rechazar');
    return data;
};

export const freeSpace = async (spaceId) => {
    const res = await fetch(`${BASE_URL}/reservas/liberar/${spaceId}`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al liberar espacio');
    return data;
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
