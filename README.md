# SERVIRE

ES: Plataforma full stack para gestion de espacios y reservas con cliente web, cliente movil y API REST.
EN: Full stack platform for space booking and management with a web client, mobile client, and REST API.
**Demo access:**
Use any email from the demo dataset and password:

```
Password: 123456
```

Example users:

* [admin@servire.com](mailto:admin@servire.com)
  
## Recruiter Snapshot (ES/EN)

- ES: Proyecto ideal para perfil Intern TI con experiencia practica en arquitectura cloud, API design y clientes multiplataforma.
- EN: Strong Intern IT portfolio project showing hands-on cloud architecture, API design, and multi-platform clients.
- ES: Stack productivo: Neon + Render + Vercel + Cloudinary.
- EN: Production-ready stack: Neon + Render + Vercel + Cloudinary.

## Architecture

```mermaid
flowchart LR
    U1[Web User] --> W[Vercel - React + Vite]
    U2[Mobile User] --> M[Expo - React Native]

    W -->|HTTP /api| B[Render - Express API]
    M -->|HTTP /api| B

    B -->|SQL| D[(Neon PostgreSQL)]
    B -->|Media Upload| C[Cloudinary]
```

### Monorepo Structure

- backend/: Node.js + Express API, JWT auth, business logic, scheduled cleanup jobs.
- SERVIRE DESKTOP/frontend/: React + Vite web app.
- SERVIRE MOVIL/frontend/: React Native + Expo app.

## Technical Scope (ES/EN)

- ES: Autenticacion y autorizacion por roles con JWT (usuario/admin).
- EN: Role-based authentication and authorization via JWT (user/admin).
- ES: Gestion de espacios con soporte de imagen principal y galeria (Cloudinary).
- EN: Space management with cover image and gallery support (Cloudinary).
- ES: Flujo de reservas con estados y acciones administrativas.
- EN: Reservation workflow with state transitions and admin actions.
- ES: Proceso cron para expirar reservas, liberar espacios y limpiar datos antiguos.
- EN: Cron process to expire reservations, release spaces, and clean old records.

## Backend API Overview

Base URL:
- Web: ${VITE_API_URL}/api
- Mobile: ${EXPO_PUBLIC_API_URL}

Main endpoints:

1. Auth
- POST /auth/register
- POST /auth/login
- POST /auth/change-password
- GET /auth/me
- GET /auth/users (admin)
- PUT /auth/users/role (admin)

2. Spaces
- GET /espacios/categorias
- GET /espacios/edificios
- GET /espacios
- GET /espacios/:id
- POST /espacios (admin, multipart)
- PUT /espacios/:id (admin, multipart)
- DELETE /espacios/imagen/:imageId (admin)
- DELETE /espacios/:id (admin)

3. Reservations
- GET /reservas/mis-reservas
- GET /reservas/admin (admin)
- POST /reservas
- PUT /reservas/:id/aprobar (admin)
- PUT /reservas/:id/rechazar (admin)
- DELETE /reservas/:id
- PUT /reservas/liberar/:spaceId (admin)

## Tech Stack

Backend:
- Node.js, Express 5, pg, JWT, Multer, Cloudinary, dotenv, CORS

Web:
- React 19, Vite, React Router, Tailwind CSS 4, Recharts

Mobile:
- React Native, Expo, React Navigation, AsyncStorage

## Environment Variables

Backend (backend/.env)

```env
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# Optional local fallback (if DATABASE_URL is not set)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pi_sdr1
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=change_this_in_production

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Web (SERVIRE DESKTOP/frontend/.env)

```env
VITE_API_URL=https://your-backend.onrender.com
```

Mobile (SERVIRE MOVIL/frontend/.env)

```env
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## Local Setup

Requirements:
- Node.js 18+
- pnpm

1. Backend

```bash
cd backend
pnpm install
pnpm dev
```

2. Web

```bash
cd "SERVIRE DESKTOP/frontend"
pnpm install
pnpm dev
```

3. Mobile

```bash
cd "SERVIRE MOVIL/frontend"
pnpm install
pnpm dev
```

## Deployment Notes (Neon + Render + Vercel + Cloudinary)

1. Neon
- Create PostgreSQL project.
- Copy connection string into Render as DATABASE_URL.
- Ensure SSL is enabled (sslmode=require).

2. Render (backend)
- Root: backend
- Build: pnpm install
- Start: pnpm start
- Required env vars: PORT, DATABASE_URL, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

3. Vercel (web)
- Root: SERVIRE DESKTOP/frontend
- Framework: Vite
- Build: pnpm build
- Output: dist
- Env var: VITE_API_URL pointing to public Render URL (without /api)

4. Cloudinary
- Set credentials in Render.
- Upload folder used by backend: servire.

## Why This Project Is Recruiter-Relevant

- ES: Muestra integracion real de servicios cloud y no solo desarrollo local.
- EN: Demonstrates real cloud integration, not only local development.
- ES: Incluye arquitectura multi-cliente (web + movil) conectada a una sola API.
- EN: Includes multi-client architecture (web + mobile) backed by one API.
- ES: Aplica buenas practicas de backend: capas por rutas/controladores/middlewares.
- EN: Applies backend best practices: route/controller/middleware layering.
- ES: Cubre autenticacion, autorizacion, persistencia, archivos y automatizacion de limpieza.
- EN: Covers authentication, authorization, persistence, media handling, and automated cleanup jobs.

## Suggested Next Improvements

1. Add .env.example files for backend, web, and mobile.
2. Add automated tests for auth and reservation flows.
3. Remove insecure JWT fallback secret in production.
4. Add SQL migrations and seed strategy for reproducible environments.
5. Add CI pipeline for lint + build + smoke tests.

## License

Pending selection by project owner (recommended: MIT).

## Mobile App Screens (ES/EN)

ES: Vista rapida de pantallas principales de la app movil.
EN: Quick preview of key mobile app screens.

<table>
    <tr>
        <td align="center">
            <b>Main / Inicio</b><br/>
            <img src="https://github.com/user-attachments/assets/a8e0afb0-737f-4676-99a0-06bd829a542a" alt="Main screen" width="220"/>
        </td>
        <td align="center">
            <b>My Reservations / Mis Reservas</b><br/>
            <img src="https://github.com/user-attachments/assets/590f30c8-3e5b-4b2a-9877-5e77a1dc6026" alt="My reservations screen" width="220"/>
        </td>
    </tr>
    <tr>
        <td align="center">
            <b>Spaces / Espacios</b><br/>
            <img src="https://github.com/user-attachments/assets/3777a2aa-cc5b-4cc0-8a88-6c66bfb8e591" alt="Spaces screen" width="220"/>
        </td>
        <td align="center">
            <b>Account / Cuenta</b><br/>
            <img src="https://github.com/user-attachments/assets/9d9b2916-829a-4a5b-bef0-2361f05d7539" alt="Account screen" width="220"/>
        </td>
    </tr>
</table>
