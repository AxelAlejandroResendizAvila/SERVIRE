import Constants from 'expo-constants';

let API_BASE_URL = 'https://192.168.100.25/api'; //cambiar IP si es necesario
// La variable __DEV__ es de React Native y es "true" automáticamente cuando usas Expo Go
if (__DEV__) {
    // hostUri nos da la IP y puerto de Expo (ej. "192.168.1.100:8081")
    const hostUri = Constants.expoConfig?.hostUri;

    if (hostUri) {
        // Cortamos el texto donde está los dos puntos ":" para quedarnos solo con la IP
        const pcIp = hostUri.split(':')[0];

        // Armamos la URL apuntando al puerto 3000 de tu backend
        API_BASE_URL = `http://${pcIp}:3000/api`;
    }
}

export const config = {
    baseURL: API_BASE_URL,
};

export default config;