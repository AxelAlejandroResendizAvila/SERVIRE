<div align="center">

# SERVIRE

**ES:** Plataforma full stack para gestión de espacios y reservas con cliente web administrativo, cliente móvil y API REST.

**EN:** Full stack platform for space booking and management with an admin web client, mobile client, and REST API.

[![Live Demo](https://img.shields.io/badge/Web-Live%20Demo-black?style=for-the-badge&logo=vercel)](https://servire-tau.vercel.app)
[![Download APK](https://img.shields.io/badge/Android-Download%20APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://expo.dev/artifacts/eas/gxqnkv6ZdFXtehrSzhKDFS.apk)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repositorio-181717?style=for-the-badge&logo=github)](https://github.com/AxelAlejandroResendizAvila/SERVIRE)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## 📱 Acceso Rápido / Quick Access

<table align="center">
  <tr>
    <td align="center">
      <b>🌐 Web App (Vercel)</b><br/><br/>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://servire-tau.vercel.app" alt="QR Web App" width="180"/><br/><br/>
      <a href="https://servire-tau.vercel.app">servire-tau.vercel.app</a>
    </td>
    <td width="80"></td>
    <td align="center">
      <b>📦 Android APK</b><br/><br/>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://expo.dev/artifacts/eas/gxqnkv6ZdFXtehrSzhKDFS.apk" alt="QR APK" width="180"/><br/><br/>
      <a href="https://expo.dev/artifacts/eas/gxqnkv6ZdFXtehrSzhKDFS.apk">Descargar APK</a>
    </td>
  </tr>
</table>

---

## 🔐 Credenciales de Demo / Demo Credentials

| Rol / Role | Email | Contraseña / Password |
|---|---|---|
| 👑 Administrador | `admin@servire.com` | `Axel1234` |
| 🛡️ Operador | `operador@servire.com` | `Axel1234` |
| 👤 Usuario demo | Cualquier otro email del dataset | `123456` |

---

## ✨ Funcionalidades Destacadas / Key Features

| Área | Funcionalidad |
|---|---|
| 🔐 **Seguridad** | RBAC granular con 3 roles, JWT por propósito, recuperación por SMS (Twilio) |
| 📅 **Reservas** | Motor de conflictos de tiempo en UTC, cron de expiración cada 60s, fila de espera |
| ⏱️ **UI en vivo** | Countdown regresivo para reservas activas en Web y App Móvil |
| 📊 **Reportes** | Exportación a Excel/CSV y PDF con diseño corporativo via jsPDF |
| 🖼️ **Media** | Galería dinámica por espacio con portada y carrusel — Cloudinary |
| 🛡️ **Integridad** | `adminEnforcement.js` garantiza siempre un administrador activo en el sistema |

---

## 👥 Sistema de Roles / Role System (RBAC)

### 👑 Administrador (Admin)

- Gestión completa de espacios: crear, editar, eliminar, gestionar galería (Cloudinary).
- Aprobar, rechazar y liberar reservas.
- Bloquear / desbloquear y eliminar **cualquier** cuenta de usuario.
- Asignar o modificar roles a cualquier usuario.
- **Transferencia de Rol Admin** — acción irreversible con doble confirmación:

  > El sistema exige escribir exactamente:
  > ```
  > Otorgo mi permiso a [nombre del usuario]
  > ```
  > y confirmar con contraseña. Al completar, **la sesión se cierra automáticamente** y el admin cede todos sus privilegios.

- `adminEnforcement.js` garantiza que **siempre exista exactamente un administrador activo**, evitando bloqueos permanentes del sistema.

---

### 🛡️ Operador

- Aprobar y rechazar reservas.
- Bloquear / desbloquear usuarios base.
- **No puede** afectar a otros operadores ni al administrador.
- **No puede** crear, editar ni eliminar espacios.
- **No puede** eliminar cuentas de usuario.

---

### 👤 Usuario Base

- Acceso exclusivo a la App Móvil.
- Explorar espacios disponibles y crear / cancelar sus propias reservas.
- Ver su **posición exacta en la fila de espera** en tiempo real.
- Gestionar perfil: nombre, teléfono y contraseña desde interfaz nativa.

> ⚠️ Cuando un usuario es bloqueado, **todas sus reservas pendientes y confirmadas se cancelan automáticamente**.

---

## 🛡️ Seguridad / Security

### Recuperación de contraseña por SMS (Twilio)

```
Usuario solicita recuperación
        ↓
Backend genera código OTP de 6 dígitos
        ↓
Twilio envía SMS al número registrado
        ↓
Usuario ingresa el código en la app
        ↓
Backend emite JWT con { purpose: 'password_reset' }
        ↓
Usuario establece su nueva contraseña con el token válido
```

- El JWT es de **propósito único** — no es válido para ninguna otra acción autenticada.
- El código expira automáticamente para evitar reutilización.

---

## 📅 Motor de Reservas / Reservation Engine

### Detección de conflictos de tiempo

El backend valida en cada nueva solicitud que no exista solapamiento con reservas ya aprobadas en el mismo espacio, comparando `fecha_inicio` y `fecha_fin` en **UTC**. Si hay conflicto, la reserva es rechazada antes de persistirse.

### Ciclo de vida automatizado (Cron)

```
Cada 60 segundos:
  → Detecta reservas aprobadas con fecha_fin vencida
  → Las marca como 'completadas'
  → Libera el espacio automáticamente
```

### Fila de espera (Waitlist)

- El usuario puede unirse a la lista de espera de un espacio ocupado.
- La App Móvil muestra la **posición exacta en la fila en tiempo real**.
- Al liberarse el espacio, el primer usuario en fila puede tomar la reserva.

### Countdown en vivo

Web y App Móvil muestran un **temporizador regresivo** (`CountdownTimer`) para reservas activas próximas a vencer.

---

## 📊 Inteligencia de Negocio / Business Intelligence

### Dashboard Web con Recharts

Visualizaciones interactivas filtrables por periodo:

- **Hoy / Semana / Mes / Año / Rango libre personalizado**
- Tendencias de reservas en el tiempo
- **Top 5** espacios más reservados vs. menos reservados

### Exportación de Reportes

| Formato | Herramienta | Contenido |
|---|---|---|
| **CSV / Excel** | Nativo | Metadatos del periodo, métricas de efectividad, desglose por estado |
| **PDF** | jsPDF | Header oscuro, tablas estilizadas, métricas clave con diseño corporativo |

---

## 🏗️ Arquitectura / Architecture

```mermaid
flowchart LR
    U1[Web Admin] --> W[Vercel - React + Vite]
    U2[Mobile User] --> M[Expo - React Native]

    W -->|HTTP /api| B[Render - Express API]
    M -->|HTTP /api| B

    B -->|SQL| D[(Neon PostgreSQL)]
    B -->|Media Upload| C[Cloudinary]
    B -->|SMS OTP| T[Twilio]
    B -->|Cron 60s| B
```

### Estructura del monorepo / Monorepo Structure

```
SERVIRE/
├── backend/
│   ├── routes/           # Definición de endpoints
│   ├── controllers/      # Lógica de negocio
│   ├── middlewares/      # Auth, roles, adminEnforcement
│   ├── seed.js           # Datos de prueba
│   └── setup-admin.js    # Inicialización del administrador
├── SERVIRE DESKTOP/
│   └── frontend/         # React + Vite (Web Admin)
└── SERVIRE MOVIL/
    └── frontend/         # React Native + Expo (App Móvil)
```

---

## 🛠️ Tech Stack

| Capa | Tecnologías |
|---|---|
| **Backend** | Node.js, Express 5, pg, JWT, Multer, multer-storage-cloudinary, node-cron, CORS |
| **Web** | React 19, Vite, React Router, Tailwind CSS 4, Recharts, jsPDF |
| **Mobile** | React Native, Expo, React Navigation, AsyncStorage, AnimatedCard |
| **Cloud** | Neon (PostgreSQL), Render (API), Vercel (Web), Cloudinary (Media), Twilio (SMS) |

---

## 🔌 API Overview

**Base URL:**
- Web: `${VITE_API_URL}/api`
- Mobile: `${EXPO_PUBLIC_API_URL}`

<details>
<summary><b>📋 Ver todos los endpoints / View all endpoints</b></summary>

### 1. Auth
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/forgot-password` | Público — envía SMS |
| POST | `/auth/verify-code` | Público |
| POST | `/auth/change-password` | Token reset |
| GET | `/auth/me` | Autenticado |
| GET | `/auth/users` | Admin / Operador |
| PUT | `/auth/users/role` | Admin |

### 2. Espacios / Spaces
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/espacios/categorias` | Autenticado |
| GET | `/espacios/edificios` | Autenticado |
| GET | `/espacios` | Autenticado |
| GET | `/espacios/:id` | Autenticado |
| POST | `/espacios` | Admin (multipart) |
| PUT | `/espacios/:id` | Admin (multipart) |
| DELETE | `/espacios/imagen/:imageId` | Admin |
| DELETE | `/espacios/:id` | Admin |

### 3. Reservas / Reservations
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/reservas/mis-reservas` | Autenticado |
| GET | `/reservas/admin` | Admin / Operador |
| POST | `/reservas` | Autenticado |
| PUT | `/reservas/:id/aprobar` | Admin / Operador |
| PUT | `/reservas/:id/rechazar` | Admin / Operador |
| DELETE | `/reservas/:id` | Autenticado |
| PUT | `/reservas/liberar/:spaceId` | Admin |

### 4. Reportes / Reports
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/reportes/csv` | Admin |
| GET | `/reportes/pdf` | Admin |

</details>

---

## 📱 Mobile App Screens

> Las imágenes están en `screenshots/mobile/`. Súbelas a tu repo o arrástralas a un Issue de GitHub para obtener las URLs.

### 🔐 Autenticación / Auth

<table>
    <tr>
        <td align="center">
            <b>Iniciar Sesión</b><br/><br/>
            <img src="screenshots/mobile/login.jpg" alt="Login" width="200"/>
        </td>
        <td align="center">
            <b>Crear Cuenta</b><br/><br/>
            <img src="screenshots/mobile/register.jpg" alt="Register" width="200"/>
        </td>
        <td align="center">
            <b>Recuperar Contraseña</b><br/><br/>
            <img src="screenshots/mobile/forgot-password.jpg" alt="Forgot Password" width="200"/>
        </td>
    </tr>
</table>

### 🏠 Inicio y Exploración

<table>
    <tr>
        <td align="center">
            <b>Inicio</b><br/><br/>
            <img src="screenshots/mobile/home.jpg" alt="Home" width="200"/>
        </td>
        <td align="center">
            <b>Explorar Espacios</b><br/><br/>
            <img src="screenshots/mobile/explore.jpg" alt="Explore Spaces" width="200"/>
        </td>
        <td align="center">
            <b>Información del Espacio</b><br/><br/>
            <img src="screenshots/mobile/space-detail.jpg" alt="Space Detail" width="200"/>
        </td>
    </tr>
</table>

### 📅 Reservas

<table>
    <tr>
        <td align="center">
            <b>Nueva Reserva</b><br/>
            <sub>Galería + fecha/hora + resumen</sub><br/><br/>
            <img src="screenshots/mobile/new-reservation.jpg" alt="New Reservation" width="200"/>
        </td>
        <td align="center">
            <b>Próximas</b><br/>
            <sub>Countdown en vivo ⏱️</sub><br/><br/>
            <img src="screenshots/mobile/reservations-upcoming.jpg" alt="Upcoming Reservations" width="200"/>
        </td>
        <td align="center">
            <b>Historial</b><br/>
            <sub>Reservas completadas</sub><br/><br/>
            <img src="screenshots/mobile/reservations-history.jpg" alt="Reservation History" width="200"/>
        </td>
    </tr>
</table>

### 👤 Cuenta

<table>
    <tr>
        <td align="center">
            <b>Mi Cuenta</b><br/>
            <sub>Perfil + cambio de contraseña</sub><br/><br/>
            <img src="screenshots/mobile/account.jpg" alt="Account" width="200"/>
        </td>
    </tr>
</table>

---

## ⚙️ Setup Local / Local Setup

**Requisitos / Requirements:** Node.js 18+, pnpm

### 1. Backend

```bash
cd backend
cp .env.example .env   # Configura tus variables de entorno
pnpm install
pnpm dev
```

### 2. Web

```bash
cd "SERVIRE DESKTOP/frontend"
cp .env.example .env
pnpm install
pnpm dev
```

### 3. Mobile

```bash
cd "SERVIRE MOVIL/frontend"
cp .env.example .env
pnpm install
pnpm dev
```

---

## 🌍 Variables de Entorno / Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

JWT_SECRET=change_this_in_production

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Web (`SERVIRE DESKTOP/frontend/.env`)

```env
VITE_API_URL=https://your-backend.onrender.com
```

### Mobile (`SERVIRE MOVIL/frontend/.env`)

```env
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## 🚀 Deployment (Neon + Render + Vercel + Cloudinary)

<details>
<summary><b>Ver instrucciones de despliegue / View deployment instructions</b></summary>

### 1. Neon (Base de datos)
- Crear proyecto PostgreSQL.
- Copiar connection string como `DATABASE_URL` en Render.
- Asegurar SSL habilitado (`sslmode=require`).
- Ejecutar `seed.js` para datos de prueba y `setup-admin.js` para el admin inicial.

### 2. Render (Backend)
- Root: `backend`
- Build: `pnpm install`
- Start: `pnpm start`
- Env vars requeridas: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `TWILIO_*`

### 3. Vercel (Web)
- Root: `SERVIRE DESKTOP/frontend`
- Framework: Vite
- Build: `pnpm build`
- Output: `dist`
- Env var: `VITE_API_URL` → URL pública de Render (sin `/api`)

### 4. Cloudinary (Media)
- Configurar credenciales en Render.
- Carpeta de uploads usada por el backend: `servire`.

</details>

---

## 🔮 Mejoras Sugeridas / Suggested Improvements

- [ ] Añadir archivos `.env.example` para backend, web y móvil.
- [ ] Implementar tests automatizados para flujos de auth, reservas y reportes.
- [ ] Agregar migraciones SQL y estrategia de seeds versionada.
- [ ] Configurar pipeline CI con lint + build + smoke tests.
- [ ] Notificaciones push en App Móvil para cambios de estado en reservas.
- [ ] Rate limiting en endpoints de auth para protección contra fuerza bruta.
- [ ] Eliminar el fallback inseguro de JWT secret en producción.

---

## 👨‍💻 Equipo / Team

| # | GitHub | Commits | Líneas añadidas |
|---|---|---|---|
| 1 | [@AxelAlejandroResendizAvila](https://github.com/AxelAlejandroResendizAvila) | 59 | 39,985 |
| 2 | [@ZzyzzMolina](https://github.com/ZzyzzMolina) | 22 | 21,979 |
| 3 | [@AlejandroMaldonadoMoreno](https://github.com/AlejandroMaldonadoMoreno) | 11 | 1,650 |
| 4 | [@124050316-ship-it](https://github.com/124050316-ship-it) | 2 | 1 |
| 5 | [@jorgerangel09](https://github.com/jorgerangel09) | 2 | 303 |

---

## 📄 Licencia / License

Pendiente de selección por el propietario del proyecto — se recomienda **MIT**.

---

<div align="center">
  <sub>Built with ☕ by the SERVIRE team · 2025</sub>
</div>
