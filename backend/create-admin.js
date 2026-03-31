import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pi_sdr1',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

async function createAdmin() {
    try {
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
        console.log('  Email:', email);
        console.log('  Nombre:', nombre);
        console.log('  Apellidos:', apellidos);
        console.log('  Contraseña:', contrasena);
        console.log('  Rol: admin');
        
        // Primero, eliminar si existe
        await pool.query(
            'DELETE FROM usuarios WHERE email = $1',
            [email]
        );
        console.log('✅ Registros anteriores eliminados');
        
        // Insertar nuevo admin
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono, rol) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id_usuario, nombre, email, rol`,
            [nombre, apellidos, email, contrasena_hash, telefono, 'admin']
        );
        
        console.log('\n✅ ¡Usuario admin creado exitosamente!');
        console.log('\n📝 Credenciales:');
        console.log('  Correo:', email);
        console.log('  Contraseña:', contrasena);
        console.log('\nID de usuario:', result.rows[0].id_usuario);
        
    } catch (error) {
        console.error('❌ Error al crear admin:', error.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
