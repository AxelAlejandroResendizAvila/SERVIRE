import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // 1. Get all spaces and join with categories to map the names
        // 2. We also want to simulate 'waitlistCount' by counting pending reservations roughly.
        // For a real production app, waitlists would be a separate table or queue, 
        // but here we just count how many 'pendiente' reservations exist for the space.

        const query = `
      SELECT 
        e.id_espacio as id, 
        e.nombre as name, 
        e.capacidad as capacity, 
        e.disponible as is_available,
        COALESCE(c.nombre, 'General') as type,
        (
          SELECT COUNT(*) 
          FROM reservas r 
          WHERE r.id_espacio = e.id_espacio AND r.estado = 'pendiente'
        ) as "waitlistCount"
      FROM espacios e
      LEFT JOIN categorias c ON e.id_categoria = c.id_categoria
    `;

        const result = await pool.query(query);

        // Map to frontend expected format
        const spaces = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            type: row.type,
            // Map true/false to 'disponible'/'ocupado' as frontend expects
            state: row.is_available ? 'disponible' : 'ocupado',
            waitlistCount: parseInt(row.waitlistCount)
        }));

        res.json(spaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los espacios' });
    }
});

export default router;
