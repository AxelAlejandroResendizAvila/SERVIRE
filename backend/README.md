# SERVIRE Backend

API REST para el sistema de gestión de espacios y reservas.

## Setup Inicial

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Crear archivo `.env`
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pi_sdr1
DB_PASSWORD=<tu_password>
DB_PORT=5432
PORT=3000
JWT_SECRET=tu_secret_key
```

### 3. Inicializar Base de Datos
```bash
# Crear admin único (credenciales: admin@servire.com / Admin123@)
pnpm run setup-admin

# Crear usuarios de prueba
pnpm run setup-users
```

## Scripts Disponibles

```bash
pnpm run dev           # Inicia servidor en modo desarrollo (con hot-reload)
pnpm run start         # Inicia servidor en producción
pnpm run setup-admin   # Crea admin único
pnpm run setup-users   # Crea usuarios de prueba
pnpm run create-admin  # Alternativa a setup-admin
```

## Estructura

```
src/
  ├── index.js                 # Punto de entrada
  ├── config/db.js             # Conexión a BD
  ├── controllers/             # Lógica de negocio
  ├── middleware/              # Autenticación, uploads
  ├── routes/                  # Definición de rutas
  ├── cron/                    # Tareas programadas
  └── utils/                   # Funciones auxiliares
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener datos del usuario
- `POST /api/auth/change-password` - Cambiar contraseña
- `GET /api/auth/users` - Listar usuarios (admin/operador)
- `PUT /api/auth/users/toggle-operador` - Otorgar rol operador (solo admin)
- `POST /api/auth/transfer-admin` - Transferir rol admin (solo admin)
- `PUT /api/auth/users/toggle-block` - Bloquear usuario (admin/operador)
- `DELETE /api/auth/users/:userId` - Eliminar usuario (solo admin)

### Espacios
- `GET /api/espacios` - Listar espacios
- `GET /api/espacios/:id` - Obtener espacio
- `POST /api/espacios` - Crear espacio (solo admin)
- `PUT /api/espacios/:id` - Editar espacio (solo admin)
- `DELETE /api/espacios/:id` - Eliminar espacio (solo admin)

### Reservas
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/mis-reservas` - Mis reservas
- `GET /api/reservas/admin` - Panel de admin (admin/operador)
- `PUT /api/reservas/:id/aprobar` - Aprobar (admin/operador)
- `PUT /api/reservas/:id/rechazar` - Rechazar (admin/operador)
- `DELETE /api/reservas/:id` - Cancelar reserva personal

## Roles y Permisos

Ver `ROLES_Y_PERMISOS.md` en la raíz del proyecto para documentación completa.

## Base de Datos

PostgreSQL 12+

## Debug Scripts

Los siguientes scripts de debugging están en `.gitignore`:
- `check-reservas.js` - Ver reservas de un usuario
- `check-table.js` - Inspeccionar tablas
- `inspect-db.js` - Inspector DB
- `test-backend-login.js` - Test de login
- `verify-credentials.js` - Verificar credenciales
