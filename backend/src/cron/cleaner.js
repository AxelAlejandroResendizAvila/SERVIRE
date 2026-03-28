import pool from '../config/db.js';

export const startCronJobs = () => {
    // Se ejecuta cada minuto (60000 ms)
    setInterval(async () => {
        try {
            
            // 1. Terminar reservas cuyo tiempo ya se agotó (fecha_fin <= NOW())
            const expiredRes = await pool.query(`
                SELECT id_reserva, id_espacio, fecha_fin, estado, 
                       fecha_fin AT TIME ZONE 'UTC' as fecha_fin_utc,
                       NOW() AT TIME ZONE 'UTC' as now_utc
                FROM reservas 
                WHERE estado = 'confirmada' 
                AND fecha_fin <= NOW() AT TIME ZONE 'UTC'
            `);
                        
            if (expiredRes.rows.length > 0) {
                console.log(`✓ ${expiredRes.rows.length} reservas confirmadas han expirado`);
                expiredRes.rows.forEach(row => {
                    console.log(`  → Reserva #${row.id_reserva}: fecha_fin=${row.fecha_fin_utc}, now=${row.now_utc}`);
                });
            }
            
            for (let row of expiredRes.rows) {
                // Cambiar estado a completada
                const updateResult = await pool.query(
                    "UPDATE reservas SET estado = 'completada' WHERE id_reserva = $1 RETURNING *", 
                    [row.id_reserva]
                );
                
                // Liberar el espacio
                await pool.query("UPDATE espacios SET disponible = true WHERE id_espacio = $1", [row.id_espacio]);
            }
            
            // 2. Eliminar de la base de datos las reservas antiguas (más de 24 horas desde que terminaron)
            const deletedOldRes = await pool.query(`
                DELETE FROM reservas 
                WHERE estado IN ('completada', 'cancelada') 
                AND fecha_fin <= NOW() AT TIME ZONE 'UTC' - INTERVAL '24 hours'
                RETURNING id_reserva
            `);
            
            if (deletedOldRes.rows.length > 0) {
                console.log(`♻ ${deletedOldRes.rows.length} reservas antiguas (>24h) eliminadas`);
            }
            
            // 3. Limpiar agresivamente: también eliminar reservas pendientes/rechazadas que ya pasaron su fecha
            const deletedPastRes = await pool.query(`
                DELETE FROM reservas 
                WHERE estado IN ('pendiente', 'cancelada')
                AND fecha_fin < NOW() AT TIME ZONE 'UTC' - INTERVAL '1 hour'
                RETURNING id_reserva
            `);
            
            if (deletedPastRes.rows.length > 0) {
                console.log(`♻ ${deletedPastRes.rows.length} reservas pendientes antiguas (>1h) eliminadas`);
            }
        } catch (error) {
            console.error('❌ Error ejecutando tareas en segundo plano:', error);
        }
    }, 60 * 1000);
    
    console.log("✓ Tareas en segundo plano (cron jobs) iniciadas cada 60 segundos.");
};
