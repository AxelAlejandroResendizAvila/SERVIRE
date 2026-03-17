// Configuración de la API
// Ajusta esta URL según tu entorno (desarrollo, staging, etc)

const API_BASE_URL = 'http://localhost:3000/api';

// Para dispositivos físicos o emuladores Android que necesitan acceso a localhost en host
// Usa: 'http://10.0.2.2:3000/api' en emulador Android
// Usa: 'http://192.168.x.x:3000/api' reemplazando con tu IP local para dispositivos físicos

export const config = {
  apiKey: API_BASE_URL,
  baseURL: API_BASE_URL,
};

export default config;
