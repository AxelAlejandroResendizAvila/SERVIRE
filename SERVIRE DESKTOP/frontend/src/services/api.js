export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/api`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('servire_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const getAuthHeadersMultipart = () => {
    const token = localStorage.getItem('servire_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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

export const getMe = async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener usuario');
    return data;
};

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

export const getEdificios = async () => {
    try {
        const res = await fetch(`${BASE_URL}/espacios/edificios`);
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

export const declineReservation = async (reservationId, motivo) => {
    const res = await fetch(`${BASE_URL}/reservas/${reservationId}/rechazar`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivo_estado: motivo })
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

export const getUsers = async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return await res.json();
};

export const updateUserRole = async (userId, newRole) => {
    const res = await fetch(`${BASE_URL}/auth/users/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, newRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar rol');
    return data;
};

// Función para obtener estadísticas de reservas por espacio
export const getReservationStats = async () => {
    try {
        const [spaces, reservations] = await Promise.all([
            getSpaces(),
            getAdminRequests()
        ]);

        console.log('📊 Espacios recibidos:', spaces);
        console.log('📊 Reservas recibidas:', reservations);

        // Si no hay espacios o reservas, retornar array vacío para usar mock
        if (!spaces || spaces.length === 0) {
            console.warn('⚠️ No hay espacios disponibles');
            return [];
        }

        // Contar reservas confirmadas por espacio
        const stats = spaces.map(space => {
            const confirmedReservations = reservations.filter(
                r => r.spaceId === space.id && r.status === 'approved'
            ).length;
            
            const totalReservations = reservations.filter(
                r => r.spaceId === space.id
            ).length;

            return {
                spaceId: space.id,
                spaceName: space.name,
                confirmedCount: confirmedReservations,
                totalCount: totalReservations,
                building: space.buildingId
            };
        });

        console.log('✅ Estadísticas calculadas:', stats);
        return stats.sort((a, b) => b.confirmedCount - a.confirmedCount);
    } catch (e) {
        console.error('❌ Error al obtener estadísticas:', e);
        return [];
    }
};
