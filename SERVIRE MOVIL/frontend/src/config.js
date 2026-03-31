import Constants from 'expo-constants';

// ========================================
// ⚠️ IMPORTANTE: CAMBIAR ESTO SI CAMBIAS DE RED
// ========================================
// IP de tu computadora en la red local (para desarrollo)
const DEV_IP = '10.197.243.165';

// En modo desarrollo, apunta al backend local
let API_BASE_URL = `http://${DEV_IP}:3000/api`;

// En producción, apunta a Render
if (!__DEV__) {
    API_BASE_URL = 'https://servire.onrender.com/api';
}

console.log(`🌐 Modo: ${__DEV__ ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`🔗 API Base URL: ${API_BASE_URL}`);

export const config = {
    baseURL: API_BASE_URL,
};

export default config;