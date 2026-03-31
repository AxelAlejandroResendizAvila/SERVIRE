import Constants from 'expo-constants';

// URL de producción (Render)
//let API_BASE_URL = 'https://192.168.100.25/api'; //cambiar IP si es necesario
let API_BASE_URL = 'https://servire.onrender.com/api';

// En modo desarrollo, apunta al backend local automáticamente
if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;

    if (hostUri) {
        const pcIp = hostUri.split(':')[0];
        API_BASE_URL = `http://${pcIp}:3000/api`;
    }
}

export const config = {
    baseURL: API_BASE_URL,
};

export default config;