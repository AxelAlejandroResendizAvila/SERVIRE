import pool from '../config/db.js';

/**
 * Garantiza que solo exista un administrador en el sistema.
 * Si hay múltiples admins, degrada los extras a operador.
 * También crea un índice UNIQUE en la BD.
 */
export const enforceSingleAdmin = async () => {
    try {
        // Verificar cuántos admins existen
        const adminsResult = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE rol = $1 ORDER BY id_usuario ASC',
            ['admin']
        );

        // Si hay más de 1, degradar los extras
        if (adminsResult.rows.length > 1) {
            const keepAdminId = adminsResult.rows[0].id_usuario;
            const demoteIds = adminsResult.rows.slice(1).map((r) => r.id_usuario);

            await pool.query(
                'UPDATE usuarios SET rol = $1 WHERE id_usuario = ANY($2::int[])',
                ['operador', demoteIds]
            );

            console.warn(
                `⚠️  Se detectaron ${adminsResult.rows.length} administradores. ` +
                `Se conservó id=${keepAdminId} como admin y ${demoteIds.length} degradados a operador.`
            );
        }

        // Crear índice UNIQUE para garantizar un solo admin
        await pool.query(
            "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_single_admin_idx ON usuarios (rol) WHERE rol = 'admin'"
        );

        console.log('✅ Restricción de admin único verificada.');
    } catch (error) {
        console.error('❌ Error al verificar restricción de admin único:', error.message);
        throw error;
    }
};
