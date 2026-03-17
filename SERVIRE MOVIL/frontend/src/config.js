// Configuración de la API
// Ajusta esta URL según tu entorno (desarrollo, staging, etc)

// IMPORTANTE: Descomenta la URL que corresponda a tu entorno:

// Para desarrollo en navegador web (http://localhost o 127.0.0.1)
// const API_BASE_URL = 'http://localhost:3000/api';

// Para emulador Android (required for Android emulator to access localhost on host machine)
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Para dispositivo físico o emulador iOS (reemplaza 192.168.1.X con tu IP local)
// const API_BASE_URL = 'http://192.168.1.100:3000/api';

export const config = {
  apiKey: API_BASE_URL,
  baseURL: API_BASE_URL,
};

export default config;
