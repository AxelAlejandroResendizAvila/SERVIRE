# 🧪 Pruebas de Validación - Rol Operador

## Casos de Uso de Prueba

### 1. **Crear Admin Único**
```bash
cd backend
npm run setup-admin
```

✅ **Resultado esperado:**
- Admin creado: `admin@servire.com`
- Si ya existían admins, son degradados a operador
- Base de datos fuerza índice UNIQUE

---

### 2. **Configurar Operador**

**En la BD (manual):**
```sql
UPDATE usuarios SET rol = 'operador' 
WHERE email = 'alguien@email.com';
```

**O en UI como Admin:**
1. Ir a **Gestión de Usuarios**
2. Buscar usuario
3. Clic en botón con icono 🛡️ azul (Operador)
4. Usuario pasa a ser Operador

---

### 3. **Verificar Permisos de Admin**

| Tarea | Expected |
|-------|----------|
| Ver Espacios | ✅ Visible |
| Crear Espacio | ✅ Botón en UI + acceso API |
| Editar Espacio | ✅ Botón editar + acceso API |
| Eliminar Espacio | ✅ Botón eliminar + acceso API |
| Aprobar Reserva | ✅ Botón ✓ |
| Rechazar Reserva | ✅ Botón ✗ |
| Ver Usuarios | ✅ Visible |
| Otorgar Operador | ✅ Botón 🛡️ |
| Bloquear Usuario | ✅ Botón 🚫 |
| Desbloquear Usuario | ✅ Botón 🚫 |
| **Transferir Admin** | ✅ Botón 🛡️ rojo |
| Ver Reportes | ✅ Visible |
| Eliminar Usuario | ✅ Botón 🗑️ |

---

### 4. **Verificar Permisos de Operador**

| Tarea | Result | Note |
|-------|--------|------|
| Ver Espacios | ✅ Visible | Solo lectura |
| Crear Espacio | ❌ Oculto | No botón en UI |
| Editar Espacio | ❌ Oculto | No botón editar |
| Eliminar Espacio | ❌ Oculto | No botón eliminar |
| **Aprobar Reserva** | ✅ Visible | **Puede hacer** |
| **Rechazar Reserva** | ✅ Visible | **Puede hacer** |
| Ver Usuarios | ✅ Visible | Solo para bloquear |
| **Otorgar Operador** | ❌ Sin permisos | Error en API |
| **Bloquear Usuario** | ✅ Botón 🚫 | Solo bloquear |
| **Desbloquear Usuario** | ❌ Deshabilitado | Solo admin |
| Transferir Admin | ❌ Error en API | Solo admin |
| Ver Reportes | ❌ Oculto | No acceso |
| Eliminar Usuario | ❌ Error en API | Solo admin |

---

### 5. **Test: Operador Intenta Otorgar Rol**

**Acción:** Como operador, hace POST a `/api/auth/users/toggle-operador`

**Respuesta esperada (403):**
```json
{
  "error": "Solo el administrador puede modificar roles de operador"
}
```

---

### 6. **Test: Operador Intenta Desbloquear**

**Acción:** Como operador, usuario está bloqueado, hace PUT a `/api/auth/users/toggle-block`

**Respuesta esperada (403):**
```json
{
  "error": "Solo el administrador puede desbloquear cuentas"
}
```

---

### 7. **Test: Operador Intenta Bloquear Otro Operador**

**Acción:** Como operador, intenta bloquear otro operador

**Respuesta esperada (400):**
```json
{
  "error": "Los operadores no pueden bloquear a otros operadores"
}
```

---

### 8. **Test: Transferencia de Admin**

**Precondición:** Admin debe existir

**Acción:** Como admin:
1. Ir a **Gestión de Usuarios**
2. Buscar usuario destino
3. Clic en botón **Transferir Admin** (🛡️ rojo)
4. Modal solicita:
   - Contraseña: `Admin123@`
   - Frase: `Otorgo mi permiso a admin`
5. Clic en "Confirmar"

**Resultado esperado:**
- ✅ Mensaje: "Rol de administrador transferido a [nombre]. Tu sesión será cerrada."
- ✅ Usuario destino ahora es admin
- ✅ Admin anterior es usuario
- ✅ Sesión admin anterior cierra (redirect a login)

---

### 9. **Test: Transferencia Falla - Frase Incorrecta**

**Acción:** Admin intenta transferir pero escribe frase incorrecta

**Input:** `"Otorgo permiso de admin"` (falta "a")

**Respuesta esperada (400):**
```json
{
  "error": "Debes escribir exactamente: \"Otorgo mi permiso a admin\""
}
```

---

### 10. **Test: Transferencia Falla - Contraseña Incorrecta**

**Acción:** Admin intenta transferir con contraseña incorrecta

**Input:** 
- Frase correcta: `"Otorgo mi permiso a admin"`
- Contraseña: `"WrongPassword123"`

**Respuesta esperada (401):**
```json
{
  "error": "Contraseña incorrecta"
}
```

---

### 11. **Test: Single Admin Enforcement**

**Acción:** Editar BD manualmente para crear 2 admins

```sql
UPDATE usuarios SET rol = 'admin' WHERE id IN (1, 2);
```

**Reiniciar backend:**
```bash
npm run dev
```

**Resultado esperado:**
- ✅ Logs mostran: "Se detectaron 2 administradores. Se conservó id=1 como admin y 1 se cambió a operador."
- ✅ BD tiene solo 1 admin y 1 nuevo operador

---

### 12. **Test: Operador Ve Solo Reservas**

**Como Operador:**

1. Sidebar ve:
   - ✅ Espacios (lectura)
   - ✅ Solicitudes
   - ✅ Usuarios
   - ❌ Crear Espacio
   - ❌ Reportes

2. En Espacios:
   - ✅ Ver lista
   - ❌ Botón "Nuevo Espacio" oculto
   - ❌ Botón editar oculto (en cards)
   - ❌ Botones eliminar ocultos

3. En Solicitudes:
   - ✅ Ver todas
   - ✅ Botón aprobar ✓
   - ✅ Botón rechazar/cancelar ✗

4. En Usuarios:
   - ✅ Ver lista
   - ✅ Botón bloquear (solo si NO está bloqueado)
   - ❌ Sin botón otorgar rol
   - ❌ Sin botón transferir admin
   - ❌ Sin botón eliminar

---

## 📊 Tabla de Validación Final

| Test | Admin | Operador | Usuario | Status |
|------|-------|----------|---------|--------|
| Single admin en BD | ✅ | - | - | ✅ |
| Admin puede crear espacio | ✅ | ❌ | ❌ | ✅ |
| Admin puede editar espacio | ✅ | ❌ | ❌ | ✅ |
| Admin puede eliminar espacio | ✅ | ❌ | ❌ | ✅ |
| Admin puede aprobar reserva | ✅ | ✅ | ❌ | ✅ |
| Admin puede rechazar reserva | ✅ | ✅ | ❌ | ✅ |
| Admin puede otorgar operador | ✅ | ❌ | ❌ | ✅ |
| Admin puede desbloquear | ✅ | ❌ | ❌ | ✅ |
| Admin puede transferir | ✅ | ❌ | ❌ | ✅ |
| Operador bloquea usuario | - | ✅ | - | ✅ |
| Operador desbloquea usuario | - | ❌ | - | ✅ |
| Operador otorga rol | - | ❌ | - | ✅ |
| Operador bloquea operador | - | ❌ | - | ✅ |
| UI esconde crear para operador | - | ✅ | - | ✅ |
| UI esconde reportes operador | - | ✅ | - | ✅ |
| Frase exacta requerida | ✅ | - | - | ✅ |

---

## 🔍 Comandos Útiles

### Consultar roles en BD
```sql
SELECT id_usuario, email, rol FROM usuarios;
```

### Contar admins
```sql
SELECT COUNT(*) FROM usuarios WHERE rol = 'admin';
```

### Ver índice único
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename='usuarios' AND indexname LIKE '%admin%';
```

### Resetear roles (todos a usuario)
```sql
UPDATE usuarios SET rol = 'usuario';
```

---

## ✅ Checklist Final

- [ ] Backend compila sin errores
- [ ] Frontend desktop compila sin errores
- [ ] Setup script crea admin único
- [ ] Admin puede hacer todas las acciones
- [ ] Operador puede aprobar/rechazar
- [ ] Operador NO puede otorgar roles
- [ ] Operador NO puede desbloquear
- [ ] Transferencia require frase exacta
- [ ] Transferencia cierra sesión
- [ ] Operador NO ve crear/editar/eliminar
- [ ] Operador NO ve reportes
- [ ] BD fuerza un solo admin
- [ ] API rechaza operador en admin routes
- [ ] UI oculta acciones prohibidas

**¡Todo listo para validar! 🚀**
