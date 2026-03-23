import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// 1. Create a reservation
router.post('/', authMiddleware, async (req, res) => {
    const { id_espacio, fecha_inicio, fecha_fin, precio_total } = req.body;
    const id_usuario = req.usuario; // from auth middleware

    try {
        // Check if space exists and is available
        const spaceResult = await pool.query('SELECT disponible FROM espacios WHERE id_espacio = $1', [id_espacio]);
        if (spaceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        // Default dates if not provided by frontend yet (since current UI doesn't have date pickers)
        const start = fecha_inicio || new Date().toISOString();
        const end = fecha_fin || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours
        const price = precio_total || 0;

        // Check if available. If available -> status: confirmada. If occupied -> status: pendiente (waitlist)
        const isAvailable = spaceResult.rows[0].disponible;
        const isWaitlist = !isAvailable;

        const query = `
      INSERT INTO reservas (id_usuario, id_espacio, fecha_inicio, fecha_fin, estado, precio_total)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const values = [id_usuario, id_espacio, start, end, isWaitlist ? 'pendiente' : 'confirmada', price];
        const newReservation = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: isWaitlist ? 'Te has unido a la fila' : 'Reserva creada exitosamente',
            reserva: newReservation.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar reserva' });
    }
});

// 2. Get reservations for logged in user (MyReservations view)
router.get('/mis-reservas', authMiddleware, async (req, res) => {
    const id_usuario = req.usuario;

    try {
        const query = `
      SELECT 
        r.id_reserva as id,
        r.id_espacio as "spaceId",
        TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD') as date,
        CONCAT(TO_CHAR(r.fecha_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.fecha_fin, 'HH24:MI')) as time,
        r.estado
      FROM reservas r
      WHERE r.id_usuario = $1
      ORDER BY r.fecha_inicio DESC
    `;

        const result = await pool.query(query, [id_usuario]);

        // Map to frontend expectations
        const reservations = result.rows.map(row => {
            let status = 'waitlisted'; // Map 'pendiente'
            if (row.estado === 'confirmada' || row.estado === 'completada') status = 'approved';
            if (row.estado === 'cancelada') status = 'declined'; // Reusing decline badge for canceled

            return {
                id: row.id,
                spaceId: row.spaceId,
                date: row.date,
                time: row.time,
                status: status,
                // Waitlist mock visualization: position 1 of 1 (ideally query count of older pending reservations for same space here)
                waitlistPosition: status === 'waitlisted' ? 1 : null,
                waitlistTotal: status === 'waitlisted' ? 1 : null
            };
        });

        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tus reservas' });
    }
});

// 3. Admin: Get all requests
router.get('/admin', async (req, res) => {
    try {
        const query = `
      SELECT 
        r.id_reserva as id,
        CONCAT(u.nombre, ' ', u.apellidos) as requester,
        e.nombre as space,
        TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD') as date,
        CONCAT(TO_CHAR(r.fecha_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.fecha_fin, 'HH24:MI')) as time,
        r.estado,
        r.id_usuario,
        r.id_espacio
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN espacios e ON r.id_espacio = e.id_espacio
      ORDER BY r.fecha_creacion DESC
    `;

        const result = await pool.query(query);

        const requests = result.rows.map(row => {
            let status = 'pending';
            if (row.estado === 'confirmada') status = 'approved';
            if (row.estado === 'pendiente') status = 'pending';
            if (row.estado === 'cancelada') status = 'declined';

            return {
                id: row.id,
                requester: row.requester,
                space: row.space,
                date: row.date,
                time: row.time,
                status: status,
                id_usuario: row.id_usuario,
                id_espacio: row.id_espacio,
                estado: row.estado
            };
        });

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener panel de admin' });
    }
});

// 4. Update reservation (must be pending)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, precio_total } = req.body;

    try {
        // Check reservation exists and is pending
        const reservation = await pool.query(
            'SELECT * FROM reservas WHERE id_reserva = $1',
            [id]
        );

        if (reservation.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const currentReserva = reservation.rows[0];
        
        // Only allow editing if status is 'pendiente'
        if (currentReserva.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Solo se pueden editar reservas en estado pendiente' });
        }

        // Update reservation
        const result = await pool.query(
            `UPDATE reservas 
             SET fecha_inicio = $1, fecha_fin = $2, precio_total = $3
             WHERE id_reserva = $4
             RETURNING *`,
            [fecha_inicio || currentReserva.fecha_inicio, fecha_fin || currentReserva.fecha_fin, precio_total || currentReserva.precio_total, id]
        );

        res.json({
            mensaje: 'Reserva actualizada exitosamente',
            reserva: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar reserva' });
    }
});

// 4.5 Get reservation details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT 
                r.*,
                e.nombre as espacio_nombre,
                e.capacidad,
                u.nombre as usuario_nombre
            FROM reservas r
            JOIN espacios e ON r.id_espacio = e.id_espacio
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_reserva = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener detalles de la reserva' });
    }
});

// 5. Update reservation status (Admin only)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        const validStates = ['pendiente', 'confirmada', 'cancelada', 'completada'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const result = await pool.query(
            'UPDATE reservas SET estado = $1 WHERE id_reserva = $2 RETURNING *',
            [estado, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json({
            mensaje: 'Reserva actualizada',
            reserva: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar reserva' });
    }
});

// 6. Cancel reservation (user can cancel only if pending)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const reservation = await pool.query(
            'SELECT estado FROM reservas WHERE id_reserva = $1',
            [id]
        );

        if (reservation.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        if (reservation.rows[0].estado !== 'pendiente') {
            return res.status(400).json({ error: 'Solo se pueden cancelar reservas en estado pendiente' });
        }

        await pool.query(
            'UPDATE reservas SET estado = $1 WHERE id_reserva = $2',
            ['cancelada', id]
        );

        res.json({ mensaje: 'Reserva cancelada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cancelar reserva' });
    }
});

export default router;
