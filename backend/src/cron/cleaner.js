import pool from '../config/db.js';

export const startCronJobs = () => {
    // Se ejecuta cada minuto (60000 ms)
    setInterval(async () => {
        try {
            // 1. Terminar reservas cuyo tiempo ya se agotó (fecha_fin <= NOW())
            const expiredRes = await pool.query(`
                SELECT id_reserva, id_espacio 
                FROM reservas 
                WHERE estado = 'confirmada' AND fecha_fin <= NOW()
            `);
            
            for (let row of expiredRes.rows) {
                // Cambiar estado a terminada
                await pool.query("UPDATE reservas SET estado = 'terminada' WHERE id_reserva = $1", [row.id_reserva]);
                // Liberar el espacio
                await pool.query("UPDATE espacios SET disponible = true WHERE id_espacio = $1", [row.id_espacio]);
            }
            
            // 2. Eliminar de la base de datos las reservas canceladas o terminadas hace más de 24 horas
            await pool.query(`
                DELETE FROM reservas 
                WHERE estado IN ('terminada', 'completada', 'cancelada') 
                AND fecha_fin <= NOW() - INTERVAL '24 hours'
            `);
        } catch (error) {
            console.error('Error ejecutando tareas en segundo plano:', error);
        }
    }, 60 * 1000);
    
    console.log("Tareas en segundo plano (cron jobs) iniciadas.");
};
