import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pi_sdr1',
    password: 'Hidvod8l$',
    port: 5432,
});

async function checkTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'usuarios'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estructura de la tabla usuarios:\n');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name} - ${row.data_type} (NULL: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTable();
