import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pi_sdr1',
    password: 'Hidvod8l$',
    port: 5432,
});

async function checkDatabase() {
    try {
        // Obtener todas las tablas
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tablas en la base de datos:\n');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Buscar columnas con "rol"
        console.log('\n🔍 Búsqueda de columnas con "rol":\n');
        const rolesResult = await pool.query(`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE column_name ILIKE '%rol%'
        `);
        
        if (rolesResult.rows.length > 0) {
            rolesResult.rows.forEach(row => {
                console.log(`  ${row.table_name}.${row.column_name}`);
            });
        } else {
            console.log('  No se encontraron columnas con "rol"');
        }

        // Ver datos en usuarios
        console.log('\n👥 Usuarios actuales:\n');
        const usersResult = await pool.query('SELECT id_usuario, nombre, apellidos, email FROM usuarios');
        if (usersResult.rows.length > 0) {
            usersResult.rows.forEach(row => {
                console.log(`  ${row.nombre} ${row.apellidos} (${row.email})`);
            });
        } else {
            console.log('  No hay usuarios en la base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();
