import pool from '../config/db.js';

export const createReservation = async (req, res) => {
    const { id_espacio, fecha_inicio, fecha_fin } = req.body;
    const id_usuario = req.usuario;

    try {
        const spaceResult = await pool.query('SELECT disponible, nombre FROM espacios WHERE id_espacio = $1', [id_espacio]);
        if (spaceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        const start = fecha_inicio || new Date().toISOString();
        const end = fecha_fin || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const now = new Date();

        // Validar que la fecha de inicio no sea en el pasado
        if (new Date(start) < now) {
            return res.status(400).json({ error: 'No puedes hacer reservas en fechas pasadas' });
        }

        // Validar que la fecha de fin no sea en el pasado
        if (new Date(end) < now) {
            return res.status(400).json({ error: 'La fecha de término no puede ser en el pasado' });
        }

        // Validar que inicio sea antes que fin
        if (new Date(start) >= new Date(end)) {
            return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la de fin' });
        }

        // Validar que no haya conflictos de horarios para el mismo espacio (reservas pendientes y confirmadas)
        const conflictQuery = `
            SELECT * FROM reservas 
            WHERE id_espacio = $1 
            AND estado IN ('pendiente', 'confirmada')
            AND (
                (fecha_inicio < $3 AND fecha_fin > $2) -- Hay algún solapamiento
            )
        `;
        const conflictResult = await pool.query(conflictQuery, [id_espacio, start, end]);

        if (conflictResult.rows.length > 0) {
            return res.status(400).json({ error: 'El espacio ya está reservado en este horario' });
        }

        const query = `
      INSERT INTO reservas (id_usuario, id_espacio, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, 'pendiente')
      RETURNING *
    `;
        const newReservation = await pool.query(query, [id_usuario, id_espacio, start, end]);

        const positionQuery = `
      SELECT COUNT(*) as pos FROM reservas 
      WHERE id_espacio = $1 AND estado = 'pendiente' AND fecha_creacion <= $2
    `;
        const posResult = await pool.query(positionQuery, [id_espacio, newReservation.rows[0].fecha_creacion]);

        res.status(201).json({
            success: true,
            message: `Solicitud enviada. Posición en fila: ${posResult.rows[0].pos}`,
            reserva: newReservation.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar reserva' });
    }
};

export const getMyReservations = async (req, res) => {
    const id_usuario = req.usuario;

    try {
        const query = `
      SELECT 
        r.id_reserva as id,
        r.id_espacio as "spaceId",
        e.nombre as "spaceName",
        ed.nombre as "buildingName",
        TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD') as date,
        CONCAT(TO_CHAR(r.fecha_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.fecha_fin, 'HH24:MI')) as time,
        r.estado,
        r.fecha_inicio as "startDateRaw",
        r.fecha_fin as "endDateRaw",
        r.motivo_estado,
        (
          SELECT COUNT(*) FROM reservas r2 
          WHERE r2.id_espacio = r.id_espacio 
          AND r2.estado = 'pendiente' 
          AND r2.fecha_creacion <= r.fecha_creacion
        ) as "queuePosition",
        (
          SELECT COUNT(*) FROM reservas r3 
          WHERE r3.id_espacio = r.id_espacio 
          AND r3.estado = 'pendiente'
        ) as "queueTotal"
      FROM reservas r
      JOIN espacios e ON r.id_espacio = e.id_espacio
      LEFT JOIN edificios ed ON e.id_edificio = ed.id_edificio
      WHERE r.id_usuario = $1
      ORDER BY r.fecha_creacion DESC
    `;

        const result = await pool.query(query, [id_usuario]);

        const reservations = result.rows.map(row => {
            let status = 'waitlisted';
            if (row.estado === 'confirmada') status = 'approved';
            if (row.estado === 'completada' || row.estado === 'terminada') status = 'completed';
            if (row.estado === 'cancelada') status = 'declined';

            return {
                id: row.id,
                spaceId: row.spaceId,
                spaceName: row.spaceName,
                buildingName: row.buildingName,
                date: row.date,
                time: row.time,
                startDateRaw: row.startDateRaw,
                endDateRaw: row.endDateRaw,
                status,
                motivo_rechazo: row.motivo_estado, 
                waitlistPosition: status === 'waitlisted' ? parseInt(row.queuePosition) : null,
                waitlistTotal: status === 'waitlisted' ? parseInt(row.queueTotal) : null
            };
        });

        res.json(reservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tus reservas' });
    }
};

export const getAdminRequests = async (req, res) => {
    try {
        const query = `
      SELECT 
        r.id_reserva as id,
        r.id_espacio as "spaceId",
        r.id_usuario as "userId",
        CONCAT(u.nombre, ' ', u.apellidos) as requester,
        u.email as "requesterEmail",
        e.nombre as space,
        TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD') as date,
        CONCAT(TO_CHAR(r.fecha_inicio, 'HH24:MI'), ' - ', TO_CHAR(r.fecha_fin, 'HH24:MI')) as time,
        TO_CHAR(r.fecha_creacion, 'YYYY-MM-DD HH24:MI') as "createdAt",
        r.estado,
        r.fecha_inicio as "startDateRaw",
        r.fecha_fin as "endDateRaw",
        (
          SELECT COUNT(*) FROM reservas r2 
          WHERE r2.id_espacio = r.id_espacio 
          AND r2.estado = 'pendiente' 
          AND r2.fecha_creacion <= r.fecha_creacion
        ) as "queuePosition"
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN espacios e ON r.id_espacio = e.id_espacio
      ORDER BY 
        CASE r.estado 
          WHEN 'pendiente' THEN 1 
          WHEN 'confirmada' THEN 2 
          WHEN 'completada' THEN 3
          ELSE 4 
        END,
        r.fecha_creacion ASC
    `;

        const result = await pool.query(query);
        console.log(`✅ Admin requests: Se encontraron ${result.rows.length} solicitudes`);

        const requests = result.rows.map(row => {
            let status = 'pending';
            if (row.estado === 'confirmada') status = 'approved';
            if (row.estado === 'cancelada') status = 'declined';
            if (row.estado === 'completada' || row.estado === 'terminada') status = 'completed';

            return {
                id: row.id,
                spaceId: row.spaceId,
                userId: row.userId,
                requester: row.requester,
                requesterEmail: row.requesterEmail,
                space: row.space,
                date: row.date,
                time: row.time,
                startDateRaw: row.startDateRaw,
                endDateRaw: row.endDateRaw,
                createdAt: row.createdAt,
                status,
                queuePosition: row.estado === 'pendiente' ? parseInt(row.queuePosition) : null
            };
        });

        res.json(requests);
    } catch (error) {
        console.error('❌ Error en getAdminRequests:', error);
        res.status(500).json({ error: 'Error al obtener panel de admin' });
    }
};

export const approveReservation = async (req, res) => {
    const { id } = req.params;

    try {
        const reservaResult = await pool.query('SELECT * FROM reservas WHERE id_reserva = $1', [id]);
        if (reservaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = reservaResult.rows[0];

        if (reserva.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Solo se pueden aprobar reservas pendientes' });
        }

        const activeReservation = await pool.query(
            "SELECT id_reserva FROM reservas WHERE id_espacio = $1 AND estado = 'confirmada' LIMIT 1",
            [reserva.id_espacio]
        );

        if (activeReservation.rows.length > 0) {
            return res.status(400).json({
                error: 'Este espacio ya tiene una reserva activa. Libera el espacio primero.'
            });
        }

        await pool.query("UPDATE reservas SET estado = 'confirmada' WHERE id_reserva = $1", [id]);
        await pool.query('UPDATE espacios SET disponible = false WHERE id_espacio = $1', [reserva.id_espacio]);

        res.json({ success: true, message: 'Reserva aprobada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al aprobar la reserva' });
    }
};

export const declineReservation = async (req, res) => {
    const { id } = req.params;
    const { motivo_estado } = req.body || {};

    try {
        const reservaResult = await pool.query('SELECT * FROM reservas WHERE id_reserva = $1', [id]);
        if (reservaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = reservaResult.rows[0];
        await pool.query(
            "UPDATE reservas SET estado = 'cancelada', motivo_estado = $1 WHERE id_reserva = $2", 
            [motivo_estado || 'Cancelada por el administrador', id]
        );

        if (reserva.estado === 'confirmada') {
            const nextInLine = await pool.query(
                "SELECT id_reserva FROM reservas WHERE id_espacio = $1 AND estado = 'pendiente' ORDER BY fecha_creacion ASC LIMIT 1",
                [reserva.id_espacio]
            );

            if (nextInLine.rows.length === 0) {
                await pool.query('UPDATE espacios SET disponible = true WHERE id_espacio = $1', [reserva.id_espacio]);
            }
        }

        res.json({ success: true, message: 'Reserva rechazada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al rechazar la reserva' });
    }
};

export const cancelUserReservation = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.usuario;

    try {
        // Obtener la reserva
        const reservaResult = await pool.query('SELECT * FROM reservas WHERE id_reserva = $1', [id]);
        if (reservaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = reservaResult.rows[0];

        // Validar que pertenezca al usuario
        if (reserva.id_usuario !== id_usuario) {
            return res.status(403).json({ error: 'No tienes permiso para cancelar esta reserva' });
        }
        // Permitir eliminación según el estado actual
        if (reserva.estado === 'pendiente') {
            // Pendiente: cambiar a cancelada
            console.log(`  → Cambiando a cancelada`);
            await pool.query(
                "UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = $1",
                [id]
            );
            res.json({ success: true, message: 'Reserva cancelada exitosamente' });
        } 
        else if (reserva.estado === 'completada' || reserva.estado === 'cancelada') {
            // Completada/cancelada: eliminar del historial
            await pool.query("DELETE FROM reservas WHERE id_reserva = $1", [id]);
            res.json({ success: true, message: 'Reserva eliminada del historial' });
        } 
        else if (reserva.estado === 'confirmada') {
            // Confirmada: si está siendo eliminada desde el historial, es porque ya pasó
            // Primero intenta marcarla como completada
            await pool.query(
                "UPDATE reservas SET estado = 'completada' WHERE id_reserva = $1",
                [id]
            );
            await pool.query('UPDATE espacios SET disponible = true WHERE id_espacio = $1', [reserva.id_espacio]);
            
            // Ahora eliminarla del historial
            await pool.query("DELETE FROM reservas WHERE id_reserva = $1", [id]);
            res.json({ success: true, message: 'Reserva eliminada del historial' });
        } 
        else {
            return res.status(400).json({ error: `No se puede cancelar una reserva en estado ${reserva.estado}` });
        }
    } catch (error) {
        console.error('❌ Error cancelando reserva:', error);
        res.status(500).json({ error: 'Error al cancelar la reserva' });
    }
};

export const freeSpace = async (req, res) => {
    const { spaceId } = req.params;

    try {
        await pool.query(
            "UPDATE reservas SET estado = 'completada' WHERE id_espacio = $1 AND estado = 'confirmada'",
            [spaceId]
        );

        await pool.query('UPDATE espacios SET disponible = true WHERE id_espacio = $1', [spaceId]);

        const waitlistResult = await pool.query(
            "SELECT COUNT(*) as count FROM reservas WHERE id_espacio = $1 AND estado = 'pendiente'",
            [spaceId]
        );

        const waitlistCount = parseInt(waitlistResult.rows[0].count);

        res.json({
            success: true,
            message: waitlistCount > 0
                ? `Espacio liberado. Hay ${waitlistCount} solicitud(es) pendiente(s) en fila.`
                : 'Espacio liberado exitosamente.',
            waitlistCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al liberar el espacio' });
    }
};
