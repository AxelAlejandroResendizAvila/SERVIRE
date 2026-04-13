import pool from '../config/db.js';

export const startCronJobs = () => {
    // Se ejecuta cada minuto (60000 ms)
    setInterval(async () => {
        try {
            
            // Terminar reservas cuyo tiempo ya se agotó (fecha_fin <= NOW())
            // Solo cambia el estado a 'completada' — NO elimina nada para preservar estadísticas e historial
            const expiredRes = await pool.query(`
                SELECT id_reserva, id_espacio, fecha_fin, estado, 
                       fecha_fin AT TIME ZONE 'UTC' as fecha_fin_utc,
                       NOW() AT TIME ZONE 'UTC' as now_utc
                FROM reservas 
                WHERE estado IN ('confirmada', 'pendiente')
                AND fecha_fin <= NOW() AT TIME ZONE 'UTC'
            `);
                        
            if (expiredRes.rows.length > 0) {
                console.log(`✓ ${expiredRes.rows.length} reservas han expirado, marcando como completadas`);
                expiredRes.rows.forEach(row => {
                    console.log(`  → Reserva #${row.id_reserva}: fecha_fin=${row.fecha_fin_utc}, now=${row.now_utc}`);
                });
            }
            
            for (let row of expiredRes.rows) {
                await pool.query(
                    "UPDATE reservas SET estado = 'completada' WHERE id_reserva = $1 RETURNING *", 
                    [row.id_reserva]
                );
            }

        } catch (error) {
            console.error('❌ Error ejecutando tareas en segundo plano:', error);
        }
    }, 60 * 1000);
    
    console.log("✓ Tareas en segundo plano (cron jobs) iniciadas cada 60 segundos.");
};
