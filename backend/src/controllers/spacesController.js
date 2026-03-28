import pool from '../config/db.js';

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_categoria as id, nombre as name FROM categorias ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

export const getEdificios = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_edificio as id, nombre as name FROM edificios ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener edificios' });
    }
};

export const getAllSpaces = async (req, res) => {
    try {
        const query = `
      SELECT 
        e.id_espacio as id, 
        e.nombre as name, 
        e.capacidad as capacity, 
        e.disponible as is_available,
        e.imagen_url as image,
        e.descripcion as description,
        ed.nombre as location,
        e.id_edificio as "buildingId",
        COALESCE(c.nombre, 'General') as type,
        c.id_categoria as "categoryId",
        (
          SELECT COUNT(*) 
          FROM reservas r 
          WHERE r.id_espacio = e.id_espacio AND r.estado = 'pendiente'
        ) as "waitlistCount"
      FROM espacios e
      LEFT JOIN categorias c ON e.id_categoria = c.id_categoria
      LEFT JOIN edificios ed ON e.id_edificio = ed.id_edificio
      ORDER BY e.nombre
    `;

        const result = await pool.query(query);

        const spaces = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            type: row.type,
            categoryId: row.categoryId,
            image: row.image,
            description: row.description,
            location: row.location,
            buildingId: row.buildingId,
            state: row.is_available ? 'disponible' : 'ocupado',
            waitlistCount: parseInt(row.waitlistCount)
        }));

        res.json(spaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los espacios' });
    }
};

export const getSpaceById = async (req, res) => {
    try {
        const { id } = req.params;

        const spaceQuery = `
      SELECT 
        e.id_espacio as id, 
        e.nombre as name, 
        e.capacidad as capacity, 
        e.disponible as is_available,
        e.imagen_url as image,
        e.descripcion as description,
        ed.nombre as location,
        e.id_edificio as "buildingId",
        COALESCE(c.nombre, 'General') as type,
        c.id_categoria as "categoryId"
      FROM espacios e
      LEFT JOIN categorias c ON e.id_categoria = c.id_categoria
      LEFT JOIN edificios ed ON e.id_edificio = ed.id_edificio
      WHERE e.id_espacio = $1
    `;
        const spaceResult = await pool.query(spaceQuery, [id]);
        if (spaceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        const galleryQuery = `
      SELECT id_imagen as id, url, orden
      FROM imagenes_espacios
      WHERE id_espacio = $1
      ORDER BY orden ASC
    `;
        let gallery = [];
        try {
            const galleryResult = await pool.query(galleryQuery, [id]);
            gallery = galleryResult.rows;
        } catch (e) {
            // Table might not exist yet
        }

        const waitlistQuery = `
      SELECT 
        r.id_reserva as id,
        CONCAT(u.nombre, ' ', u.apellidos) as requester,
        u.email,
        TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD HH24:MI') as "startDate",
        TO_CHAR(r.fecha_fin, 'YYYY-MM-DD HH24:MI') as "endDate",
        TO_CHAR(r.fecha_creacion, 'YYYY-MM-DD HH24:MI') as "createdAt",
        r.estado as status
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_espacio = $1
      ORDER BY 
        CASE r.estado 
          WHEN 'pendiente' THEN 1 
          WHEN 'confirmada' THEN 2 
          ELSE 3 
        END,
        r.fecha_creacion ASC
    `;
        const waitlistResult = await pool.query(waitlistQuery, [id]);

        const space = spaceResult.rows[0];
        res.json({
            id: space.id,
            name: space.name,
            capacity: space.capacity,
            type: space.type,
            categoryId: space.categoryId,
            image: space.image,
            description: space.description,
            location: space.location,
            buildingId: space.buildingId,
            state: space.is_available ? 'disponible' : 'ocupado',
            gallery: gallery,
            waitlist: waitlistResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el espacio' });
    }
};

export const createSpace = async (req, res) => {
    const { nombre, capacidad, id_categoria, disponible, descripcion, id_edificio } = req.body;

    if (!nombre || !capacidad) {
        return res.status(400).json({ error: 'Nombre y capacidad son obligatorios' });
    }

    const mainImage = req.files?.imagen?.[0] ? `/uploads/${req.files.imagen[0].filename}` : null;

    try {
        const query = `
      INSERT INTO espacios (nombre, capacidad, id_categoria, disponible, descripcion, id_edificio, imagen_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const values = [
            nombre,
            parseInt(capacidad),
            id_categoria || null,
            disponible === 'true' || disponible === true,
            descripcion || '',
            id_edificio ? parseInt(id_edificio) : null,
            mainImage
        ];

        const newSpace = await pool.query(query, values);
        const spaceId = newSpace.rows[0].id_espacio;

        if (req.files?.galeria) {
            for (let i = 0; i < req.files.galeria.length; i++) {
                const file = req.files.galeria[i];
                try {
                    await pool.query(
                        'INSERT INTO imagenes_espacios (id_espacio, url, orden) VALUES ($1, $2, $3)',
                        [spaceId, `/uploads/${file.filename}`, i]
                    );
                } catch (e) {
                    console.error('Could not save gallery image:', e.message);
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Espacio creado exitosamente',
            espacio: newSpace.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el espacio' });
    }
};

export const updateSpace = async (req, res) => {
    const { id } = req.params;
    const { nombre, capacidad, id_categoria, disponible, descripcion, id_edificio } = req.body;

    if (!nombre || !capacidad) {
        return res.status(400).json({ error: 'Nombre y capacidad son obligatorios' });
    }

    try {
        let query, values;

        if (req.files?.imagen?.[0]) {
            const imagePath = `/uploads/${req.files.imagen[0].filename}`;
            query = `
                UPDATE espacios 
                SET nombre = $1, capacidad = $2, id_categoria = $3, disponible = $4, 
                    descripcion = $5, id_edificio = $6, imagen_url = $7
                WHERE id_espacio = $8
                RETURNING *
            `;
            values = [nombre, parseInt(capacidad), id_categoria || null,
                disponible === 'true' || disponible === true,
                descripcion || '', id_edificio ? parseInt(id_edificio) : null, imagePath, id];
        } else {
            query = `
                UPDATE espacios 
                SET nombre = $1, capacidad = $2, id_categoria = $3, disponible = $4,
                    descripcion = $5, id_edificio = $6
                WHERE id_espacio = $7
                RETURNING *
            `;
            values = [nombre, parseInt(capacidad), id_categoria || null,
                disponible === 'true' || disponible === true,
                descripcion || '', id_edificio ? parseInt(id_edificio) : null, id];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        if (req.files?.galeria) {
            for (let i = 0; i < req.files.galeria.length; i++) {
                const file = req.files.galeria[i];
                try {
                    await pool.query(
                        'INSERT INTO imagenes_espacios (id_espacio, url, orden) VALUES ($1, $2, $3)',
                        [id, `/uploads/${file.filename}`, i + 100] 
                    );
                } catch (e) {
                    console.error('Could not save gallery image:', e.message);
                }
            }
        }

        res.json({ success: true, message: 'Espacio actualizado', espacio: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el espacio' });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM imagenes_espacios WHERE id_imagen = $1 RETURNING *',
            [req.params.imageId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        res.json({ success: true, message: 'Imagen eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar imagen' });
    }
};

export const deleteSpace = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("UPDATE reservas SET estado = 'cancelada' WHERE id_espacio = $1 AND estado IN ('pendiente', 'confirmada')", [id]);

        try { await pool.query('DELETE FROM imagenes_espacios WHERE id_espacio = $1', [id]); } catch (e) { }

        const result = await pool.query('DELETE FROM espacios WHERE id_espacio = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        res.json({ success: true, message: 'Espacio eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el espacio' });
    }
};
