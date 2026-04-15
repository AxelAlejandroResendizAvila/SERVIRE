# Estructura de Roles y Permisos - SERVIRE

## Descripción General
El sistema ahora cuenta con **3 roles** con una jerarquía clara de permisos:

---

## 1. **ADMIN** (Administrador) - `admin`
*Poder absoluto del sistema. Solo puede haber UNO.*

### Permisos:
- ✅ Ver espacios
- ✅ **Crear espacios** (exclusivo)
- ✅ **Editar espacios** (exclusivo)
- ✅ **Eliminar espacios** (exclusivo)
- ✅ Aprobar/cancelar reservas
- ✅ **Gestionar roles de operadores** (crear, quitar)
- ✅ **Bloquear y desbloquear cuentas**
- ✅ **Transferir rol de admin a otro usuario** (requiere confirmación con contraseña)
- ✅ **Eliminar cuentas de usuario** (exclusivo)
- ✅ Ver reportes
- ✅ Ver lista de usuarios

### Restricciones internas:
- No puede haber más de un admin simultáneamente
- La base de datos fuerza esta restricción con un índice UNIQUE
- Al iniciar el servidor se valida y remedia automáticamente
- No puede bloquearse a sí mismo
- No puede transferirse el rol a sí mismo

---

## 2. **OPERADOR** - `operador`
*Gestión de reservas y supervisión de cuentas (sin poder absoluto).*

### Permisos:
- ✅ Ver espacios
- ✅ Aprobar/cancelar reservas (aceptar y rechazar solicitudes)
- ✅ **Bloquear cuentas de usuario** (pero NO desbloquear)
- ❌ No puede crear, editar ni eliminar espacios
- ❌ No puede gestionar roles (no puede otorgar ni quitar operador)
- ❌ No puede cambiar roles entre operadores
- ❌ No puede desbloquear cuentas (exclusivo de admin)
- ❌ No puede eliminar cuentas (exclusivo de admin)
- ❌ No puede ver reportes (exclusivo de admin)
- ❌ No puede transferir admin

### Restricciones críticas:
- Los operadores **no pueden bloquear a otros operadores**
- Los operadores **no pueden desbloquear cuentas** (solo admin puede)
- Los operadores **no pueden otorgar el rol de operador** a nadie
- Los operadores **no pueden verse rol entre ellos**

---

## 3. **USUARIO** - `usuario`
*Usuario regular sin permisos administrativos.*

### Permisos:
- ✅ Ver espacios
- ✅ Realizar reservas
- ✅ Ver mis reservas
- ❌ Acceso denegado a panel administrativo
- ❌ Sin acceso a gestión de espacios
- ❌ Sin acceso a gestión de usuarios

---

## Transferencia de Admin

### Proceso (requiere el admin actual):
1. Admin accede a **Gestión de Usuarios**
2. Selecciona un usuario y haz clic en el botón **Transferir Admin**
3. Se abre un modal que requiere:
   - **Contraseña actual** del admin
   - **Frase de confirmación exacta**: `Otorgo mi permiso a admin`
4. Si es válido, el nuevo usuario recibe rol de `admin` y el actual pasa a `usuario`
5. **La sesión del admin anterior se cierra automáticamente**

### Validaciones de seguridad:
- ✅ Se verifica contraseña con bcrypt
- ✅ Se confirma mediante frase exacta (no se puede copiar-pegar mal)
- ✅ No se permite auto-transferencia
- ✅ No se permite transferir a cuenta bloqueada
- ✅ Transacción de base de datos garantiza exactamente un admin después
- ✅ Se verifica que haya exactamente 1 admin disponible

---

## Interfaz de Usuario (Desktop / Admin Panel)

### Visibilidad de menú por rol:

**Admin ve:**
- Espacios (ver, crear, editar, eliminar)
- Solicitudes (aprobar/cancelar)
- Usuarios (gestionar roles, bloquear, transferir admin, eliminar)
- Reportes

**Operador ve:**
- Espacios (solo ver)
- Solicitudes (aprobar/cancelar)
- Usuarios (solo bloquear, no quitar roles)
- ~~Reportes~~ (oculto)
- ~~Crear/Editar/Eliminar espacios~~ (oculto)

---

## Validaciones del Backend

### En `authMiddleware`:
- Todo acceso requiere token JWT válido
- `adminMiddleware`: solo admin
- `adminOrOperadorMiddleware`: admin u operador

### En routes:
- **Espacios (CRUD)**: solo admin
- **Reservas (aprobar/rechazar)**: admin u operador
- **Usuarios (listar)**: admin u operador
- **Usuarios (roles)**: solo admin
- **Usuarios (bloquear)**: admin u operador (con excepciones)
- **Usuarios (eliminar)**: solo admin
- **Usuarios (transferencia)**: solo admin

### En controllers:
- Operadores no pueden desbloquear
- Operadores no pueden gestionar roles
- No se puede bloquear al admin
- No se puede bloquear entre operadores
- Single-admin enforcement en startup y transacciones

---

## Scripts de Setup

### `setup-admin.js` (nuevo o reinicio)
```bash
npm run setup-admin
```
- Degrada admins existentes a operador
- Crea un admin único: `admin@servire.com` / `Admin123@`

### `create-admin.js`
```bash
npm run create-admin
```
- Igual que setup-admin, garantiza admin único

### `setup-users.js`
```bash
npm run setup-users
```
- Actualiza roles de usuarios existentes a `usuario`
- Crea usuario de prueba: `usuario@servire.com` / `Usuario123@`

---

## Notas de Seguridad

1. **Single Admin Invariant**: La base de datos garantiza en nivel de schema que NO puede haber 2 admins
2. **Bloqueo de Sesión**: Transacciones en transferencia garantizan consistencia
3. **Contraseña Obligatoria**: Todas las acciones de admin requieren contraseña
4. **Frase de Confirmación**: Imposible copiar accidentalmente "Otorgo mi permiso a admin"
5. **Sin Escalada**: Los operadores NO pueden convertirse en admin ni otorgarse permisos
6. **Cierre de Sesión**: La sesión del admin anterior se cierra tras transferencia

---

## Tabla Resumen de Permisos

| Acción | Admin | Operador | Usuario |
|--------|-------|----------|---------|
| Ver espacios | ✅ | ✅ | ✅ |
| Crear espacio | ✅ | ❌ | ❌ |
| Editar espacio | ✅ | ❌ | ❌ |
| Eliminar espacio | ✅ | ❌ | ❌ |
| Aprobar reserva | ✅ | ✅ | ❌ |
| Rechazar/cancelar reserva | ✅ | ✅ | ❌ |
| Crear reserva (usuario) | ✅ | ✅ | ✅ |
| Bloquear usuario | ✅ | ✅ | ❌ |
| Desbloquear usuario | ✅ | ❌ | ❌ |
| Transferir admin | ✅ | ❌ | ❌ |
| Gestionar roles | ✅ | ❌ | ❌ |
| Eliminar usuario | ✅ | ❌ | ❌ |
| Ver reportes | ✅ | ❌ | ❌ |
| Ver usuarios | ✅ | ✅ | ❌ |

