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

async function verifyCredentials() {
    try {
        console.log('🔐 VERIFICANDO CREDENCIALES\n');
        console.log('═════════════════════════════════════════════════════════════\n');

        // Admin
        console.log('👑 CUENTA ADMIN:\n');
        let result = await pool.query(
            'SELECT id_usuario, email, nombre, contrasena_hash, rol FROM usuarios WHERE email = $1',
            ['admin@servire.com']
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('  Email: admin@servire.com');
            console.log('  Contraseña: Admin123@');
            console.log('  Nombre: ' + user.nombre);
            console.log('  Rol: ' + user.rol);
            
            const isMatch = await bcrypt.compare('Admin123@', user.contrasena_hash);
            console.log('  Contraseña válida: ' + (isMatch ? '✅ SÍ' : '❌ NO') + '\n');
        } else {
            console.log('  ❌ No existe\n');
        }

        // Usuario Regular
        console.log('👤 CUENTA USUARIO:\n');
        result = await pool.query(
            'SELECT id_usuario, email, nombre, contrasena_hash, rol FROM usuarios WHERE email = $1',
            ['usuario@servire.com']
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('  Email: usuario@servire.com');
            console.log('  Contraseña: Usuario123@');
            console.log('  Nombre: ' + user.nombre);
            console.log('  Rol: ' + user.rol);
            
            const isMatch = await bcrypt.compare('Usuario123@', user.contrasena_hash);
            console.log('  Contraseña válida: ' + (isMatch ? '✅ SÍ' : '❌ NO') + '\n');
        } else {
            console.log('  ❌ No existe\n');
        }

        console.log('═════════════════════════════════════════════════════════════\n');
        console.log('✅ Para acceder al PANEL ADMINISTRATIVO:\n');
        console.log('  📧 Correo: admin@servire.com');
        console.log('  🔑 Contraseña: Admin123@\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyCredentials();
