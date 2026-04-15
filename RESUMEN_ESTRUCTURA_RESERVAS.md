# Resumen Estructura de Datos de Reservas

## 1. BACKEND - Estructura JSON Retornada

### getMyReservations() - Para el usuario
```json
{
  "id": "numero",
  "spaceId": "numero",
  "spaceName": "string",
  "buildingName": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MI - HH:MI",
  "startDateRaw": "ISO8601 timestamp",
  "endDateRaw": "ISO8601 timestamp",
  "status": "pending|approved|completed|declined",
  "motivo_rechazo": "string o null",
  "waitlistPosition": "numero o null (si status=pending)",
  "waitlistTotal": "numero o null (si status=pending)"
}
```
**⚠️ FALTA: `createdAt` - NO se incluye en este endpoint**

### getAdminRequests() - Para el admin
```json
{
  "id": "numero",
  "spaceId": "numero",
  "userId": "numero",
  "requester": "string (nombre completo)",
  "requesterEmail": "string",
  "space": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MI - HH:MI",
  "startDateRaw": "ISO8601 timestamp",
  "endDateRaw": "ISO8601 timestamp",
  "createdAt": "YYYY-MM-DD HH:MI",
  "status": "pending|approved|declined|completed",
  "motivo_rechazo": "string o null",
  "queuePosition": "numero o null (si status=pending)"
}
```
✅ SÍ tiene `createdAt`

---

## 2. MOBILE - Renderizado en MisReservas.js

**Archivo:** `/SERVIRE MOVIL/frontend/src/screens/MisReservas.js`

### Campos mostrados en Card de Reserva:
1. **Nombre de espacio** - `reservation.spaceName` (con ícono de ubicación)
2. **Edificio** - `reservation.buildingName` (opcional, si existe)
3. **Horario inicio** - `formatLocalTime(reservation.time.split(' - ')[0])`
4. **Horario fin** - `formatLocalTime(reservation.time.split(' - ')[1])`
5. **Countdown (si approved)** - Tiempo restante calculado de `date` y `time`
6. **Fecha** - `formatDate(reservation.date)` (ej: "Lunes, 3 de Febrero 2025")
7. **Status Pill** - Estado con color (Pendiente/Confirmada/Terminada/Cancelada)
8. **Fecha de Creación** - `{reservation.createdAt}` 
   - ⚠️ **PROBLEMA: Se intenta mostrar pero NO está en el JSON que retorna getMyReservations()**
   - Línea 396: `{reservation.createdAt && (...)}`
9. **Motivo de la reserva** - `reservation.motivo` (si existe)
10. **Motivo de rechazo** - `reservation.motivo_rechazo` (solo si status === 'declined')
    - Línea 409: Muestra con ícono de información en rojo

### Cómo se calcula el countdown:
```javascript
// Usa date (YYYY-MM-DD) y time (HH:MM - HH:MM)
// Calcula diferencia entre ahora y startTime/endTime
// Muestra: "Falta XXd XXh XXm XXs para que empiece"
// O: "Te falta XXh:XXm:XXs para terminar" (si ya empezó)
```

---

## 3. DESKTOP - Renderizado en AdminPanel.jsx

**Archivo:** `/SERVIRE DESKTOP/frontend/src/pages/AdminPanel.jsx`

### Campos mostrados en Tabla de Admin:
1. **# (Posición en fila)** - `req.queuePosition` (solo si status=pending)
   - Línea 384: `<span>{req.queuePosition || '—'}</span>`
2. **Solicitante** - `req.requester` con email `req.requesterEmail`
   - Iniciales + nombre + email en dos líneas
3. **Espacio** - `req.space`
4. **Fecha** - `req.date` (YYYY-MM-DD)
5. **Horario** - `formatLocalTime(req.time.split(' - ')[0])` a `formatLocalTime(req.time.split(' - ')[1])`
   - ⚠️ **NO MUESTRA**: `req.createdAt` en la tabla principal
6. **Estado** - Badge con status (Pendiente/Activa/Terminada/Rechazada)
   - Muestra "⏱ Empieza en: XXh" si pending
   - Muestra "▶ En curso: XX:XX:XX" si approved y activo
7. **Motivo de rechazo** - 
   - Línea 407: Si status=declined, muestra botón "!" para ver motivo completo
   - Modal con texto completo del motivo

### Acciones por estado:
- **pending**: Botón ✓ Aprobar + Botón ✗ Rechazar
- **approved (no expirado)**: Botón ✗ Cancelar
- **declined/completed/expirado**: Solo lectura

---

## 4. CAMPOS DISPONIBLES EN BD vs MOSTRADOS

### Campos en Tabla BD `reservas`:
- `id_reserva` ✓
- `id_espacio` ✓
- `id_usuario` ✓
- `fecha_inicio` (ISO) → `startDateRaw` ✓
- `fecha_fin` (ISO) → `endDateRaw` ✓
- `fecha_creacion` (ISO) → `createdAt` ✅ (solo admin)
- `estado` ✓
- `motivo_estado` → `motivo_rechazo` ✓

### Status de visualización:

| Campo | Backend Mobile | Mobile App | Desktop Admin |
|-------|----------------|----------|---------|
| id | ✓ | ✓ | ✓ |
| spaceName | ✓ | **✓ Prominente** | ✓ |
| buildingName | ✓ | ✓ (subtítulo) | ✗ |
| date (formateado) | ✓ | **✓ Grande** | ✓ |
| time (formateado) | ✓ | **✓ Prominente** | ✓ |
| startDateRaw | ✓ | ✓ | ✓ |
| endDateRaw | ✓ | ✓ | ✓ |
| createdAt | **✅ SÍ** | **❌ INTENTA pero NO está** | ✓ |
| status | ✓ | **✓ Pill color** | **✓ Badge** |
| motivo_rechazo | ✓ | **✓ Rojo si declined** | **✓ Botón "!"** |
| motivo (reserva) | ✗ | ✓ | ✗ |
| queuePosition | ✓ | ✓ (si pending) | **✓ Prominente** |

---

## 5. PROBLEMA IDENTIFICADO: Fecha de Creación en Mobile

### ¿Dónde falta?
En **MisReservas.js** (Mobile), línea 396:
```javascript
{reservation.createdAt && (
    <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
        <Text style={styles.infoText}>Solicitada: {reservation.createdAt}</Text>
    </View>
)}
```

### Problema:
`getMyReservations()` en el backend NO retorna `createdAt`
- Línea 73-102 del reservationsController.js
- SELECT no incluye: `TO_CHAR(r.fecha_creacion, 'YYYY-MM-DD HH24:MI') as "createdAt"`

### Solución necesaria:
1. Agregar a SELECT de `getMyReservations()`
2. Mobile recibirá el campo y lo mostrará automáticamente (ya tiene el render code)

---

## 6. CÓMO SE MUESTRAN ACTUALMENTE LOS MOTIVOS DE RECHAZO

### Mobile (MisReservas.js, línea 409-416):
```javascript
{reservation.status === 'declined' && reservation.motivo_rechazo && (
    <View style={styles.reasonContainer}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.error} />
        <Text style={styles.reasonText} numberOfLines={3}>
            <Text style={{ fontWeight: '600' }}>Motivo rechazo: </Text>
            {reservation.motivo_rechazo}
        </Text>
    </View>
)}
```
- **Dónde:** En detalles de la tarjeta de reserva
- **Cómo:** Ícono rojo + texto en rojo
- **Límite:** 3 líneas máximo

### Desktop (AdminPanel.jsx, línea 407-416):
```javascript
{req.status === 'declined' && req.motivo_rechazo && (
    <button
        onClick={() => setMotivoModal({ open: true, motivo: req.motivo_rechazo })}
        className="... w-6 h-6 ... text-xs font-bold ..."
        title="Ver motivo completo"
    >
        !
    </button>
)}
```
- **Dónde:** En la tabla, columna de estado
- **Cómo:** Botón "!" gris que abre modal
- **Modal:** Muestra texto completo del motivo

---

## 7. CAMPOS PARA AGREGAR

Para completar la información solicitada, hace falta:

### En Mobile:
1. ✅ **Fecha de creación** - Agregar al SQL backend
2. ✅ **Tiempo restante** - Usa `date` y `time`, calcula automáticamente
3. ✅ **Motivo de rechazo** - Ya se muestra

### En Desktop:
1. ⚠️ **Fecha de creación** - Está en datos pero NO se muestra en tabla
2. ✅ **Tiempo restante** - Ya se muestra con CountdownTimer
3. ✅ **Motivo de rechazo** - Ya se muestra con botón "!"

---

## 8. PRÓXIMOS PASOS

1. **Backend:** Agregar `createdAt` a `getMyReservations()`
   - File: `reservationsController.js`
   - Add: `TO_CHAR(r.fecha_creacion, 'YYYY-MM-DD HH24:MI') as "createdAt",`
   
2. **Desktop:** Mostrar `createdAt` en tabla
   - File: `AdminPanel.jsx`
   - Add: Nueva columna con fecha de creación
   
3. **Mobile:** Ya estará listo cuando el backend envíe `createdAt`
   - Código render ya existe y está preparado
