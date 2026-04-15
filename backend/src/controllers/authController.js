import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateResetCode, sendSmsCode } from '../services/twilio.js';

export const register = async (req, res) => {
    const { nombre, apellidos, email, contrasena, telefono } = req.body;

    try {
        const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Validar que el teléfono sea único
        const phoneExist = await pool.query('SELECT * FROM usuarios WHERE telefono = $1', [telefono]);
        if (phoneExist.rows.length > 0) {
            return res.status(400).json({ error: 'El número telefónico ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        const newUser = await pool.query(
            'INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario, nombre, email, rol, telefono',
            [nombre, apellidos, email, contrasena_hash, telefono, 'usuario']
        );

        const token = jwt.sign(
            { id: newUser.rows[0].id_usuario, rol: newUser.rows[0].rol },
            process.env.JWT_SECRET || 'servire_secret_key',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: newUser.rows[0].id_usuario,
                nombre: newUser.rows[0].nombre,
                email: newUser.rows[0].email,
                rol: newUser.rows[0].rol,
                telefono: newUser.rows[0].telefono
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al registrar' });
    }
};

export const login = async (req, res) => {
    const { email, contrasena } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const unUsuario = userResult.rows[0];

        // Verificar si la cuenta está bloqueada
        if (unUsuario.bloqueado) {
            return res.status(403).json({ error: 'Tu cuenta ha sido bloqueada. Contacta al administrador.' });
        }

        const isMatch = await bcrypt.compare(contrasena, unUsuario.contrasena_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: unUsuario.id_usuario, rol: unUsuario.rol },
            process.env.JWT_SECRET || 'servire_secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: unUsuario.id_usuario,
                nombre: unUsuario.nombre,
                email: unUsuario.email,
                rol: unUsuario.rol,
                telefono: unUsuario.telefono
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al hacer login' });
    }
};

export const changePassword = async (req, res) => {
    const { passwordActual, passwordNueva } = req.body;
    const userId = req.usuario;

    try {
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado o sesión expirada' });
        }

        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = userResult.rows[0];

        const isMatch = await bcrypt.compare(passwordActual, usuario.contrasena_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordNueva_hash = await bcrypt.hash(passwordNueva, salt);

        await pool.query('UPDATE usuarios SET contrasena_hash = $1 WHERE id_usuario = $2', [
            passwordNueva_hash,
            userId
        ]);

        res.json({
            mensaje: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.usuario; // Extraído por authMiddleware
        
        const userResult = await pool.query('SELECT id_usuario as id, nombre, email, rol, telefono FROM usuarios WHERE id_usuario = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            usuario: userResult.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al obtener usuario' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id_usuario as id, nombre, email, rol, telefono, COALESCE(bloqueado, false) as bloqueado FROM usuarios ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

// Solo admin puede otorgar/quitar rol de operador
export const toggleOperador = async (req, res) => {
    const { userId } = req.body;
    const adminId = req.usuario;

    try {
        // Verificar que quien solicita es admin
        if (req.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo el administrador puede modificar roles de operador' });
        }

        const targetUser = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        if (targetUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = targetUser.rows[0];

        // No puede modificar su propio rol por esta ruta
        if (user.id_usuario === adminId) {
            return res.status(400).json({ error: 'No puedes modificar tu propio rol por esta vía' });
        }

        // No se puede modificar a otro admin
        if (user.rol === 'admin') {
            return res.status(400).json({ error: 'No puedes modificar el rol del administrador' });
        }

        const newRole = user.rol === 'operador' ? 'usuario' : 'operador';

        await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', [newRole, userId]);

        res.json({ 
            mensaje: newRole === 'operador' 
                ? `${user.nombre} ahora es Operador` 
                : `${user.nombre} ya no es Operador`,
            nuevoRol: newRole
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
};

// Transferir rol de admin a otro usuario (requiere contraseña + frase de confirmación)
export const transferAdmin = async (req, res) => {
    const { targetUserId, password, confirmPhrase } = req.body;
    const adminId = req.usuario;

    try {
        // Verificar que el solicitante es admin
        if (req.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo el administrador puede transferir su rol' });
        }

        // Verificar frase de confirmación
        const expectedPhrase = 'Otorgo mi permiso a admin';
        if (!confirmPhrase || confirmPhrase.trim() !== expectedPhrase) {
            return res.status(400).json({ error: `Debes escribir exactamente: "${expectedPhrase}"` });
        }

        await pool.query('BEGIN');

        // Bloquear el conjunto de admins para garantizar consistencia y que exista solo un admin.
        const currentAdminsResult = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE rol = $1 ORDER BY id_usuario ASC FOR UPDATE',
            ['admin']
        );

        if (currentAdminsResult.rows.length !== 1 || currentAdminsResult.rows[0].id_usuario !== adminId) {
            await pool.query('ROLLBACK');
            return res.status(409).json({ error: 'La transferencia requiere exactamente un administrador activo. Revisa la configuración de roles.' });
        }

        // Verificar contraseña del admin solicitante
        const adminResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1 FOR UPDATE', [adminId]);
        if (adminResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Admin no encontrado' });
        }

        const admin = adminResult.rows[0];
        const isMatch = await bcrypt.compare(password, admin.contrasena_hash);
        if (!isMatch) {
            await pool.query('ROLLBACK');
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Verificar que el usuario destino existe
        const targetResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1 FOR UPDATE', [targetUserId]);
        if (targetResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario destino no encontrado' });
        }

        const targetUser = targetResult.rows[0];

        // No transferirse a sí mismo
        if (adminId === targetUserId) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'No puedes transferirte el admin a ti mismo' });
        }

        // Verificar que la cuenta destino no esté bloqueada
        if (targetUser.bloqueado) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'No puedes transferir el admin a una cuenta bloqueada' });
        }

        // Realizar la transferencia: el admin actual pasa a usuario, el target pasa a admin
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', ['usuario', adminId]);
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', ['admin', targetUserId]);
        await pool.query('COMMIT');

        res.json({ 
            mensaje: `Rol de administrador transferido a ${targetUser.nombre}. Tu sesión será cerrada.`,
            transferred: true
        });
    } catch (error) {
        try {
            await pool.query('ROLLBACK');
        } catch (_) {}
        console.error(error);
        res.status(500).json({ error: 'Error al transferir el rol de admin' });
    }
};

// Bloquear/desbloquear usuario
// Admin: puede bloquear/desbloquear a usuarios y operadores (no a otro admin)
// Operador: puede bloquear/desbloquear a usuarios (no a operadores ni admin)
export const toggleBlockUser = async (req, res) => {
    const { userId } = req.body;
    const requesterId = req.usuario;
    const requesterRole = req.rol;

    try {
        if (requesterRole !== 'admin' && requesterRole !== 'operador') {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        const targetResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        if (targetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = targetResult.rows[0];

        // No se puede bloquear al admin
        if (targetUser.rol === 'admin') {
            return res.status(400).json({ error: 'No se puede bloquear al administrador' });
        }

        // Operadores no pueden bloquear/desbloquear a otros operadores
        if (requesterRole === 'operador' && targetUser.rol === 'operador') {
            return res.status(400).json({ error: 'Los operadores no pueden bloquear a otros operadores' });
        }

        // No bloquearse a sí mismo
        if (targetUser.id_usuario === requesterId) {
            return res.status(400).json({ error: 'No puedes bloquearte a ti mismo' });
        }

        const newBlockedState = !targetUser.bloqueado;

        // Si se va a bloquear, cancelar todas las reservas activas
        if (newBlockedState) {
            await pool.query(
                "UPDATE reservas SET estado = 'cancelada', motivo_estado = 'Cuenta bloqueada por administrador' WHERE id_usuario = $1 AND estado IN ('pendiente', 'confirmada')",
                [userId]
            );
        }

        await pool.query('UPDATE usuarios SET bloqueado = $1 WHERE id_usuario = $2', [newBlockedState, userId]);

        res.json({
            mensaje: newBlockedState 
                ? `La cuenta de ${targetUser.nombre} ha sido bloqueada y sus reservas canceladas`
                : `La cuenta de ${targetUser.nombre} ha sido desbloqueada`,
            bloqueado: newBlockedState
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cambiar estado de bloqueo' });
    }
};

// Eliminar usuario (SOLO admin)
export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const adminId = req.usuario;

    try {
        if (req.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo el administrador puede eliminar cuentas' });
        }

        const targetResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        if (targetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // No puede eliminarse a sí mismo
        if (parseInt(userId) === adminId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // No puede eliminar a otro admin (no debería haber, pero por seguridad)
        if (targetResult.rows[0].rol === 'admin') {
            return res.status(400).json({ error: 'No se puede eliminar la cuenta del administrador' });
        }

        // Cancelar reservas activas del usuario
        await pool.query(
            "UPDATE reservas SET estado = 'cancelada', motivo_estado = 'Cuenta eliminada por el administrador' WHERE id_usuario = $1 AND estado IN ('pendiente', 'confirmada')",
            [userId]
        );

        // Eliminar al usuario
        await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [userId]);

        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

// Actualizar perfil del usuario (nombre y teléfono)
export const updateProfile = async (req, res) => {
    const { nombre, telefono } = req.body;
    const userId = req.usuario;

    try {
        // Validar que existe el userId
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado o sesión expirada' });
        }

        if (!nombre || !telefono) {
            return res.status(400).json({ error: 'El nombre y teléfono son requeridos' });
        }

        // Validar teléfono: mínimo 10 dígitos
        const telefonoDigitos = telefono.replace(/\D/g, '');
        if (telefonoDigitos.length < 10) {
            return res.status(400).json({ error: 'El teléfono debe tener al menos 10 dígitos' });
        }

        // Validar que el teléfono sea único (excepto si es el del usuario actual)
        const phoneExist = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE telefono = $1 AND id_usuario != $2',
            [telefono.trim(), userId]
        );
        if (phoneExist.rows.length > 0) {
            return res.status(400).json({ error: 'El número telefónico ya está en uso' });
        }

        const result = await pool.query(
            'UPDATE usuarios SET nombre = $1, telefono = $2 WHERE id_usuario = $3 RETURNING id_usuario as id, nombre, email, rol, telefono',
            [nombre.trim(), telefono.trim(), userId]
        );

        if (result.rows.length === 0) {
            console.error(`Usuario no encontrado: ${userId}`);
            return res.status(404).json({ error: 'Usuario no encontrado. Intenta iniciar sesión de nuevo.' });
        }

        res.json({
            mensaje: 'Perfil actualizado correctamente',
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

// Solicitar código de reset por WhatsApp
export const requestPasswordReset = async (req, res) => {
    const { telefono } = req.body;

    try {
        if (!telefono) {
            return res.status(400).json({ error: 'El teléfono es requerido' });
        }

        // Validar teléfono: mínimo 10 dígitos
        const telefonoDigitos = telefono.replace(/\D/g, '');
        if (telefonoDigitos.length < 10) {
            return res.status(400).json({ error: 'El teléfono debe tener al menos 10 dígitos' });
        }

        // Verificar que el usuario existe
        const userResult = await pool.query(
            'SELECT id_usuario, nombre FROM usuarios WHERE telefono = $1',
            [telefono.trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró usuario con ese teléfono' });
        }

        const user = userResult.rows[0];

        // Generar código
        const resetCode = generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutos

        // Guardar código en BD
        await pool.query(
            'UPDATE usuarios SET reset_code = $1, reset_code_expires_at = $2, reset_attempts = 0 WHERE id_usuario = $3',
            [resetCode, expiresAt, user.id_usuario]
        );

        // Enviar por SMS
        const smsResult = await sendSmsCode(telefono, resetCode);
        if (!smsResult.success) {
            return res.status(500).json({ error: 'No se pudo enviar el código' });
        }

        res.json({
            mensaje: 'Código enviado por SMS',
            expiresIn: 900, // 15 minutos en segundos
        });
    } catch (error) {
        console.error('Error solicitando reset:', error);
        res.status(500).json({ error: 'Error al enviar el código' });
    }
};

// Verificar código de reset
export const verifyResetCode = async (req, res) => {
    const { telefono, code } = req.body;

    try {
        if (!telefono || !code) {
            return res.status(400).json({ error: 'Teléfono y código requeridos' });
        }

        const userResult = await pool.query(
            'SELECT id_usuario, reset_code, reset_code_expires_at FROM usuarios WHERE telefono = $1',
            [telefono.trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = userResult.rows[0];

        // Verificar que el código existe y no expiró
        if (!user.reset_code) {
            return res.status(400).json({ error: 'No hay código de reset activo' });
        }

        if (new Date() > new Date(user.reset_code_expires_at)) {
            return res.status(400).json({ error: 'El código ha expirado' });
        }

        // Verificar código
        if (user.reset_code !== code.toString()) {
            return res.status(401).json({ error: 'Código incorrecto' });
        }

        // Generar token temporal para reset
        const resetToken = jwt.sign(
            { id: user.id_usuario, purpose: 'password_reset' },
            process.env.JWT_SECRET || 'servire_secret_key',
            { expiresIn: '15m' }
        );

        res.json({
            mensaje: 'Código verificado',
            resetToken,
        });
    } catch (error) {
        console.error('Error verificando código:', error);
        res.status(500).json({ error: 'Error al verificar código' });
    }
};

// Cambiar contraseña con token de reset
export const resetPassword = async (req, res) => {
    const { telefono, newPassword, confirmPassword, resetToken } = req.body;

    try {
        if (!telefono || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar resetToken
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'servire_secret_key');
        } catch (err) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({ error: 'Token no válido para reset' });
        }

        // Verificar que el usuario existe y pertenece a ese teléfono
        const userResult = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND telefono = $2',
            [decoded.id, telefono.trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña y limpiar código
        await pool.query(
            'UPDATE usuarios SET contrasena_hash = $1, reset_code = NULL, reset_code_expires_at = NULL WHERE id_usuario = $2',
            [newPasswordHash, decoded.id]
        );

        res.json({
            mensaje: 'Contraseña actualizada correctamente',
        });
    } catch (error) {
        console.error('Error reseteando contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
};
