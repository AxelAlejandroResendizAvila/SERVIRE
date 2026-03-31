import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const { nombre, apellidos, email, contrasena, telefono } = req.body;

    try {
        const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        const newUser = await pool.query(
            'INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario, nombre, email, rol',
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
                rol: newUser.rows[0].rol
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
                rol: unUsuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al hacer login' });
    }
};

export const changePassword = async (req, res) => {
    const { id_usuario, passwordActual, passwordNueva } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id_usuario]);
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
            id_usuario
        ]);

        res.json({
            mensaje: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.usuario; // Extraído por authMiddleware
        
        const userResult = await pool.query('SELECT id_usuario as id, nombre, email, rol FROM usuarios WHERE id_usuario = $1', [userId]);
        
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
        const result = await pool.query('SELECT id_usuario as id, nombre, email, rol, telefono FROM usuarios ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

export const updateUserRole = async (req, res) => {
    const { userId, newRole } = req.body;
    try {
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', [newRole, userId]);
        res.json({ mensaje: 'Rol actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
};
