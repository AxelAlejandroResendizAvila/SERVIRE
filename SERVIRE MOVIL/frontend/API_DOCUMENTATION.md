# API Services - Documentación

## Resumen

Se ha creado un servicio API completo para la app móvil SERVIRE que se conecta con el backend. El servicio incluye autenticación, gestión de espacios y manejo de reservas.

## Archivos Creados

### 1. `src/config.js`
Archivo de configuración que define la URL base de la API.

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Importante:** Ádjusta esta URL según tu entorno:
- **Desarrollo local:** `http://localhost:3000/api`
- **Emulador Android:** `http://10.0.2.2:3000/api`
- **Dispositivo físico:** `http://192.168.x.x:3000/api` (reemplaza con tu IP local)
- **Staging/Producción:** URL de tu servidor

### 2. `src/services/api.js`
Cliente HTTP principal que gestiona todas las comunicaciones con el backend.

## Funcionalidades Implementadas

### Autenticación

#### `authLogin(email, contrasena)`
Inicia sesión con credenciales.
```javascript
try {
  const response = await authLogin('user@example.com', 'password123');
  console.log(response.usuario); // Datos del usuario
  console.log(response.token); // JWT token
} catch (error) {
  console.error(error.message);
}
```

#### `authRegister(userData)`
Registra un nuevo usuario.
```javascript
const userData = {
  nombre: 'Juan',
  apellidos: 'Pérez',
  email: 'juan@example.com',
  contrasena: 'password123',
  telefono: '+34 123 456 789' // opcional
};
const response = await authRegister(userData);
```

#### `authLogout()`
Elimina el token de autenticación.
```javascript
await authLogout();
```

#### `isAuthenticated()`
Verifica si el usuario tiene un token válido.
```javascript
const isAuth = await isAuthenticated();
```

#### `getToken() / saveToken(token) / removeToken()`
Funciones auxiliares para gestionar el token en el dispositivo.

### Espacios (Spaces)

#### `getSpaces()`
Obtiene la lista de todos los espacios disponibles.
```javascript
const spaces = await getSpaces();
// Retorna: Array de espacios con propiedades: id, name, capacity, type, state, waitlistCount
```

**Respuesta esperada:**
```javascript
[
  {
    id: 1,
    name: 'Laboratorio de Física',
    capacity: 30,
    type: 'Laboratorios',
    state: 'disponible', // o 'ocupado'
    waitlistCount: 2
  },
  // ...más espacios
]
```

#### `getSpaceById(spaceId)`
Obtiene los detalles de un espacio específico.
```javascript
const space = await getSpaceById(1);
```

### Reservas (Reservations)

#### `createReservation(reservationData)`
Crea una nueva reserva.
```javascript
const reservationData = {
  id_espacio: 1,
  fecha_inicio: '2025-02-15T10:00:00Z',
  fecha_fin: '2025-02-15T12:00:00Z',
  precio_total: 0
};
const response = await createReservation(reservationData);
```

#### `getMyReservations()`
Obtiene las reservas del usuario autenticado.
```javascript
const reservations = await getMyReservations();
// Retorna reservas con propiedades: id, spaceId, date, time, status, waitlistPosition, waitlistTotal
```

**Estados posibles:** `'approved'`, `'waitlisted'`, `'declined'`

#### `cancelReservation(reservationId)`
Cancela una reserva.
```javascript
await cancelReservation(123);
```

#### `updateReservation(reservationId, updateData)`
Actualiza los detalles de una reserva.
```javascript
await updateReservation(123, { precio_total: 50 });
```

#### `getAllReservations()` (Admin)
Obtiene todas las reservas del sistema (solo admin).
```javascript
const allReservations = await getAllReservations();
```

## Pantallas Integradas

### 1. LoginScreen
- Login con email y contraseña
- Validaciones incluidas
- Manejo de errores con mensajes
- Loading state durante la autenticación

### 2. RegistroScreen
- Registro de nuevo usuario
- Campos: nombre, apellidos, email, teléfono (opcional), contraseña
- Confirmación de contraseña
- Validaciones completas

### 3. ExplorarEspacios
- Lista de espacios disponibles
- Búsqueda y filtrado por tipo
- Cargar desde API
- Loading y error states
- Mostar capacidad y estado de disponibilidad

### 4. FormularioReservas
- Crear nueva reserva
- Selector de fecha y hora
- Cálculo automático de duración
- Integración con API
- Redirecciona a "Mis Reservas" después de crear

### 5. MisReservas
- Mostrar reservas próximas y anteriores
- Estados visuales con colores
- Posición en fila de espera (si aplica)
- Refresh automático al entrar a la pantalla
- Cargar desde API

## Manejo de Autenticación

El token JWT se almacena automáticamente en el dispositivo usando `AsyncStorage`:
- Se guarda al hacer login o registro
- Se envía automáticamente en todos los requests (header `Authorization: Bearer <token>`)
- Se elimina al hacer logout
- Se verifica si existe antes de realizar acciones que requieren autenticación

## Manejo de Errores

Todos los servicios incluyen try-catch y lanzarán errores que pueden ser capturados:
```javascript
try {
  await loginFunction();
} catch (error) {
  // error.message contiene el mensaje de error
  Alert.alert('Error', error.message);
}
```

## Próximos Pasos

1. **Instalar dependencias:** 
   ```bash
   cd SERVIRE\ MOVIL/frontend
   pnpm install
   ```

2. **Configurar URL del API:** 
   - Edita `src/config.js` con tu URL de servidor

3. **Probar la aplicación:**
   ```bash
   pnpm start
   ```

4. **Variables de entorno (.env):**
   Puedes crear un `.env` file en la raíz del frontend:
   ```
   REACT_APP_API_URL=http://192.168.x.x:3000/api
   ```

## Endpoints Base del Backend

```
POST   /api/auth/register     - Registrar nuevo usuario
POST   /api/auth/login        - Iniciar sesión
GET    /api/espacios          - Obtener todos los espacios
POST   /api/reservas          - Crear nueva reserva
GET    /api/reservas/mis-reservas - Obtener mis reservas
GET    /api/reservas/admin    - Obtener todas las reservas (admin)
```

## Notas Importantes

- El token JWT expira en **1 día** según el backend
- AsyncStorage requiere permisos en iOS/Android
- Los datos se caché automáticamente en algunos casos
- La app requiere conexión a internet para funcionar

## Troubleshooting

**Error: "Cannot connect to API"**
- Verifica que el backend está corriendo en `http://localhost:3000`
- Si usas emulador Android, usa `http://10.0.2.2:3000`
- Si usas dispositivo físico, asegurate de usar la IP correcta de tu máquina

**Error: "AsyncStorage not installed"**
- Ejecuta: `pnpm add @react-native-async-storage/async-storage`

**Error: "Credenciales inválidas"**
- Asegúrate que el usuario existe en la base de datos
- Verifica que las credenciales sean correctas

---

**Versión:** 1.0.0  
**Última actualización:** 17 Marzo, 2026
