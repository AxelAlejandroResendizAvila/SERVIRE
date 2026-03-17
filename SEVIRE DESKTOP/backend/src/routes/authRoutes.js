import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { nombre, apellidos, email, contrasena, telefono } = req.body;

    try {
        // Check if user exists
        const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        // Insert user
        const newUser = await pool.query(
            'INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nombre, email',
            [nombre, apellidos, email, contrasena_hash, telefono]
        );

        // Create JWT
        const token = jwt.sign(
            { id: newUser.rows[0].id_usuario },
            process.env.JWT_SECRET || 'servire_secret_key',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al registrar' });
    }
});

router.post('/login', async (req, res) => {
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
            { id: unUsuario.id_usuario },
            process.env.JWT_SECRET || 'servire_secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: unUsuario.id_usuario,
                nombre: unUsuario.nombre,
                email: unUsuario.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor al hacer login' });
    }
});

export default router;
