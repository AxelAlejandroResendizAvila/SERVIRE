import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pi_sdr1',
  password: 'Hidvod8l$',
  port: 5432
});

async function check() {
  try {
    // Verificar si el usuario existe
    const userRes = await pool.query(`
      SELECT id_usuario, nombre, apellidos, email 
      FROM usuarios 
      WHERE email = 'amibully@gmail.com'
    `);
    
    console.log('\n=== USUARIO ===');
    console.log(userRes.rows);
    
    if (userRes.rows.length === 0) {
      console.log('❌ Usuario NO encontrado');
      process.exit();
    }
    
    const userId = userRes.rows[0].id_usuario;
    
    // Verificar reservas del usuario
    const reservasRes = await pool.query(`
      SELECT 
        r.id_reserva,
        r.estado,
        r.fecha_inicio,
        r.fecha_fin,
        r.fecha_creacion,
        e.nombre as espacio
      FROM reservas r
      JOIN espacios e ON r.id_espacio = e.id_espacio
      WHERE r.id_usuario = $1
      ORDER BY r.fecha_creacion DESC
    `, [userId]);
    
    console.log('\n=== RESERVAS DEL USUARIO ===');
    console.log(`Total: ${reservasRes.rows.length}`);
    console.log(reservasRes.rows);
    
    // Verificar si sus reservas tienen el estado correcto en el admin
    const adminRes = await pool.query(`
      SELECT 
        r.id_reserva,
        u.email,
        r.estado,
        e.nombre as espacio,
        r.fecha_creacion
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN espacios e ON r.id_espacio = e.id_espacio
      WHERE u.email = 'amibully@gmail.com'
      ORDER BY r.fecha_creacion DESC
    `);
    
    console.log('\n=== COMO LAS VE EL ADMIN ===');
    console.log(adminRes.rows);
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
