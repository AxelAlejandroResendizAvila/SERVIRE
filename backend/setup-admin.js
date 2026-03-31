import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pi_sdr1',
    password: 'Hidvod8l$',
    port: 5432,
});

async function setupAdmin() {
    try {
        console.log('🔧 Verificando estructura de tabla usuarios...\n');

        // Verificar si columna rol existe
        const columnResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios' AND column_name='rol'
        `);

        if (columnResult.rows.length === 0) {
            console.log('➕ Agregando columna ROL a tabla usuarios...');
            await pool.query(
                'ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) DEFAULT \'usuario\''
            );
            console.log('✅ Columna ROL agregada\n');
        } else {
            console.log('✅ Columna ROL ya existe\n');
        }

        // Crear usuario admin
        console.log('🔐 Creando usuario admin...');
        
        const email = 'admin@servire.com';
        const nombre = 'Admin';
        const apellidos = 'SERVIRE';
        const telefono = '0000000000';
        const contrasena = 'Admin123@';
        
        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);
        
        console.log('📊 Datos a insertar:');
        console.log('  • Email:', email);
        console.log('  • Nombre:', nombre);
        console.log('  • Apellidos:', apellidos);
        console.log('  • Contraseña:', contrasena);
        console.log('  • Rol: admin\n');
        
        // Eliminar si existe
        await pool.query(
            'DELETE FROM usuarios WHERE email = $1',
            [email]
        );
        
        // Insertar nuevo admin
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono, rol) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id_usuario, nombre, email, rol`,
            [nombre, apellidos, email, contrasena_hash, telefono, 'admin']
        );
        
        console.log('✅ ¡Usuario admin creado exitosamente!\n');
        console.log('🎯 CREDENCIALES DE ACCESO AL PANEL ADMINISTRATIVO:');
        console.log('╔════════════════════════════════════════╗');
        console.log('║  Correo: admin@servire.com             ║');
        console.log('║  Contraseña: Admin123@                 ║');
        console.log('╚════════════════════════════════════════╝\n');
        console.log('ID de usuario:', result.rows[0].id_usuario);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

setupAdmin();
