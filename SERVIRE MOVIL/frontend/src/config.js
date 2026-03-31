const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://servire.onrender.com/api';

console.log(`🌐 Modo: ${__DEV__ ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`🔗 API Base URL: ${API_BASE_URL}`);

export const config = {
    baseURL: API_BASE_URL,
};

export default config;