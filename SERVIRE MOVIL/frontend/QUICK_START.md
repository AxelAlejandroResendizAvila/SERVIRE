# Quick Start Guide - App Móvil SERVIRE

## 📦 Instalación Rápida

### Paso 1: Instalar Dependencias

```bash
cd "SERVIRE MOVIL/frontend"
pnpm install
```

### Paso 2: Configurar la URL del API

Edita el archivo `src/config.js`:

```javascript
// Para desarrollo local (en tu máquina)
const API_BASE_URL = 'http://localhost:3000/api';

// Para emulador Android
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Para dispositivo físico (reemplaza XXX.XXX.XXX.XXX con tu IP)
const API_BASE_URL = 'http://192.168.XXX.XXX:3000/api';
```

### Paso 3: Asegúrate que el Backend esté corriendo

```bash
cd backend
npm install
npm start
# Debe mostrar: "Server corriendo en el puerto 3000"
```

### Paso 4: Inicia la App Móvil

```bash
cd "SERVIRE MOVIL/frontend"
pnpm start
```

Luego elige:
- `a` para Android
- `i` para iOS
- `w` para Web

## 🧪 Testear la App

### Credenciales de Prueba

Usa estas credenciales para hacer login:

**Email:** `test@example.com`  
**Contraseña:** `password123`

O crea una nueva cuenta en la pantalla de registro.

### Flujo de Prueba

1. **Registro:** Crea una nueva cuenta
2. **Login:** Inicia sesión con tus credenciales
3. **Explorar Espacios:** Ve la lista de espacios disponibles
4. **Hacer Reserva:** Selecciona un espacio y crea una reserva
5. **Mis Reservas:** Visualiza tus reservas activas y anteriores

## 📋 Estructuraura de Carpetas

```
SERVIRE MOVIL/frontend/
├── src/
│   ├── config.js                 # Configuración de la API
│   ├── services/
│   │   └── api.js               # Cliente HTTP (lo nuevo!)
│   ├── screens/
│   │   ├── LoginScreen.js       # Con integración de API
│   │   ├── RegistroScreen.js    # Con integración de API
│   │   ├── ExplorarEspacios.js  # Con integración de API
│   │   ├── FormularioReservas.js   # Con integración de API
│   │   ├── MisReservas.js       # Con integración de API
│   │   └── ...
│   ├── components/
│   │   ├── Button.js
│   │   ├── InputField.js
│   │   └── ...
│   └── theme/
│       └── theme.js
├── App.js
├── package.json
└── API_DOCUMENTATION.md         # Documentación del API

```

## 🔑 Variables de Entorno (Opcional)

Crea un archivo `.env` en `SERVIRE MOVIL/frontend/`:

```
REACT_APP_API_URL=http://192.168.1.100:3000/api
REACT_APP_TIMEOUT=10000
REACT_APP_ENV=development
```

## ⚙️ Dependencias Instaladas

Se han añadido estas librerías:
- `@react-native-async-storage/async-storage` - Almacenamiento local
- `axios` - Cliente HTTP (instalado, pero se usa fetch nativo en la API)

## 🚀 Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Ejecutar en navegador
pnpm web

# Ejecutar en Android
pnpm android

# Ejecutar en iOS
pnpm ios

# Limpiar caché
pnpm start --reset-cache

# Ver logs
pnpm start --verbose
```

## 📱 Requisitos del Sistema

- **Node.js:** v18 o superior
- **npm/pnpm:** última versión
- **Expo CLI:** `npm install -g expo-cli`
- **Android Studio:** Para emular Android (opcional)
- **Xcode:** Para emular iOS (solo en Mac)

## 🐛 Troubleshooting

### "Port 3001 is already in use"
```bash
# Mata el proceso que está usando el puerto
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3001
kill -9 <PID>
```

### "Cannot find module '@react-native-async-storage/async-storage'"
```bash
pnpm add @react-native-async-storage/async-storage
```

### "AsyncStorage not working on web"
AsyncStorage requiere un backend de almacenamiento:
```bash
pnpm add @react-native-async-storage/async-storage expo-file-system
```

### "Network error connecting to API"
1. Verifica que el backend esté corriendo
2. Confirma la URL en `config.js` es correcta
3. Si usas emulador, asegúrate de usar `http://10.0.2.2:3000`
4. Si usas dispositivo físico, verifica que ambos (móvil y PC) están en la misma red

### "Login falla pero el backend funciona"
1. Verifica que la BD esté corriendo
2. Confirma que el usuario existe en la BD
3. Revisa los logs del backend para más detalles

## 📚 Documentación Adicional

- [API Documentation](./API_DOCUMENTATION.md) - Documentación completa de funciones
- [Backend README](../backend/README.md) - Info del backend
- [Expo Documentation](https://docs.expo.dev/) - Docs de Expo
- [React Native Documentation](https://reactnative.dev/) - Docs de React Native

## 👨‍💻 Desarrollo

### Agregar nuevas funciones de API

1. Abre `src/services/api.js`
2. Agrega una nueva función siguiendo el patrón existente:

```javascript
export const myNewFunction = async (params) => {
  return apiCall('/path/endpoint', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};
```

3. Importa en el screen donde la necesites:

```javascript
import { myNewFunction } from '../services/api';
```

4. Úsala:

```javascript
try {
  const response = await myNewFunction(data);
} catch (error) {
  Alert.alert('Error', error.message);
}
```

---

**¡Listo! La app móvil está completamente funcional.** 🎉

Cualquier pregunta o error, revisa la documentación de la API o los logs de la consola.
