import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

const API_BASE_URL = config.baseURL;

// =====================================================
// UTILITIES
// =====================================================

/**
 * Obtiene el token almacenado en el dispositivo
 */
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      console.log('✅ Token recuperado de AsyncStorage');
      return token;
    } else {
      console.log('⚠️ No hay token en AsyncStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    return null;
  }
};

/**
 * Almacena el token en el dispositivo
 */
export const saveToken = async (token) => {
  try {
    if (!token) {
      console.error('❌ Intento de guardar un token vacío/null');
      return;
    }
    await AsyncStorage.setItem('authToken', token);
    console.log('✅ Token guardado exitosamente en AsyncStorage');
    
    // Verificar que se guardó correctamente
    const retrieved = await AsyncStorage.getItem('authToken');
    if (retrieved === token) {
      console.log('✅ Verificado: Token recuperado correctamente de AsyncStorage');
    } else {
      console.error('❌ Error: Token no se guardó correctamente');
    }
  } catch (error) {
    console.error('❌ Error guardando token:', error);
  }
};

/**
 * Elimina el token del dispositivo
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error eliminando token:', error);
  }
};

/**
 * Intenta convertir la respuesta del servidor a JSON sin romper la app.
 * - Lee el body como texto.
 * - Si viene vacío, regresa null.
 * - Si es JSON válido, lo convierte y lo regresa.
 * - Si NO es JSON, regresa el texto en { raw: texto } para poder verlo en logs.
 */
const safeParseJson = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

/**
 * Realiza una solicitud HTTP con manejo de errores
 */
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // OBTENER TOKEN - PASO 1
    const token = await getToken();
    console.log(`📍 [${new Date().toLocaleTimeString()}] Llamada a ${endpoint}`);
    console.log(`🔑 Token disponible: ${token ? '✅ Sí' : '❌ No'}`);

    // PREPARAR HEADERS - PASO 2
    const headers = {
      'Content-Type': 'application/json',
    };

    // AGREGAR AUTHORIZATION SI EXISTE TOKEN - PASO 3
    if (token && token.trim()) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`✅ Authorization header agregado`);
    } else {
      console.warn(`⚠️ ⚠️ ⚠️ NO HAY TOKEN PARA ${endpoint} ⚠️ ⚠️ ⚠️`);
    }

    // CONSTRUIR REQUEST OPTIONS - PASO 4
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    // AGREGAR BODY SI EXISTE - PASO 5
    if (options.body) {
      requestOptions.body = options.body;
      console.log(`📝 Body incluido en la petición`);
    }

    console.log(`🌐 URL: ${url}`);
    console.log(`📋 Headers finales:`, {
      'Content-Type': 'application/json',
      'Authorization': headers['Authorization'] ? '✅ Presente' : '❌ Faltante'
    });

    // REALIZAR FETCH - PASO 6
    const response = await fetch(url, requestOptions);

    // PROCESAR RESPUESTA - PASO 7
    if (!response.ok) {
      const errorData = await safeParseJson(response);
      const msg =
        (errorData && (errorData.error || errorData.message)) ||
        `HTTP Error: ${response.status}`;
      console.error(`❌ Error HTTP ${response.status}:`, msg);
      throw new Error(msg);
    }

    const data = await safeParseJson(response);
    console.log(`✅ Respuesta exitosa para ${endpoint}`);
    return data;

  } catch (error) {
    console.error(`❌ Error en apiCall para ${endpoint}:`, error.message);
    throw error;
  }
};

// =====================================================
// AUTENTICACIÓN
// =====================================================

/**
 * Registra un nuevo usuario
 * @param {Object} userData - { nombre, apellidos, email, contrasena, telefono }
 * @returns {Promise} - { token, usuario }
 */
export const authRegister = async (userData) => {
  const response = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (response.token) {
    await saveToken(response.token);
    // Pequeño delay para asegurar que AsyncStorage guardó el token
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return response;
};

/**
 * Inicia sesión con email y contraseña
 * @param {string} email
 * @param {string} contrasena
 * @returns {Promise} - { token, usuario }
 */
export const authLogin = async (email, contrasena) => {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  });

  if (response.token) {
    await saveToken(response.token);
    // Pequeño delay para asegurar que AsyncStorage guardó el token
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('🎯 Token listo para usar en próximas peticiones');
  }

  return response;
};

/**
 * Cierra sesión limpiando el token local
 */
export const authLogout = async () => {
  await removeToken();
};

/**
 * Verifica si el usuario tiene token válido
 */
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

// =====================================================
// ESPACIOS (SPACES)
// =====================================================

/**
 * Obtiene la lista de todos los espacios disponibles
 * @returns {Promise} - Array de espacios
 */
export const getSpaces = async () => {
  return apiCall('/espacios', {
    method: 'GET',
  });
};

/**
 * Obtiene los detalles de un espacio específico
 * @param {number} spaceId
 * @returns {Promise} - Datos del espacio
 */
export const getSpaceById = async (spaceId) => {
  return apiCall(`/espacios/${spaceId}`, {
    method: 'GET',
  });
};

// =====================================================
// RESERVAS (RESERVATIONS)
// =====================================================

/**
 * Crea una nueva reserva
 * @param {Object} reservationData - { id_espacio, fecha_inicio, fecha_fin, precio_total }
 * @returns {Promise} - Datos de la reserva creada
 */
export const createReservation = async (reservationData) => {
  return apiCall('/reservas', {
    method: 'POST',
    body: JSON.stringify(reservationData),
  });
};

/**
 * Obtiene las reservas del usuario autenticado
 * @returns {Promise} - Array de reservas del usuario
 */
export const getMyReservations = async () => {
  return apiCall('/reservas/mis-reservas', {
    method: 'GET',
  });
};

/**
 * Obtiene todas las reservas (solo admin)
 * @returns {Promise} - Array de todas las reservas
 */
export const getAllReservations = async () => {
  return apiCall('/reservas/admin', {
    method: 'GET',
  });
};

/**
 * Actualiza una reserva existente (solo si está pendiente)
 * @param {number} reservationId
 * @param {Object} updateData - { fecha_inicio, fecha_fin, precio_total }
 * @returns {Promise}
 */
export const updateReservation = async (reservationId, updateData) => {
  return apiCall(`/reservas/${reservationId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Obtiene los detalles de una reserva específica
 * @param {number} reservationId
 * @returns {Promise} - Datos de la reserva
 */
export const getReservationById = async (reservationId) => {
  return apiCall(`/reservas/${reservationId}`, {
    method: 'GET',
  });
};

/**
 * Cancela una reserva (solo si está pendiente)
 * @param {number} reservationId
 * @returns {Promise}
 */
export const cancelReservation = async (reservationId) => {
  return apiCall(`/reservas/${reservationId}`, {
    method: 'DELETE',
  });
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
  // Auth
  authRegister,
  authLogin,
  authLogout,
  isAuthenticated,
  getToken,
  saveToken,
  removeToken,

  // Spaces
  getSpaces,
  getSpaceById,

  // Reservations
  createReservation,
  getMyReservations,
  getAllReservations,
  getReservationById,
  cancelReservation,
  updateReservation,
};
