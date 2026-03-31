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

async function testLogin() {
    try {
        console.log('🔍 Verificando datos de admin en BD...\n');

        const result = await pool.query(
            'SELECT id_usuario, email, nombre, contrasena_hash, rol FROM usuarios WHERE email = $1',
            ['admin@servire.com']
        );

        if (result.rows.length === 0) {
            console.log('❌ Usuario admin no encontrado en la BD');
            return;
        }

        const user = result.rows[0];
        console.log('✅ Usuario encontrado:');
        console.log('  ID:', user.id_usuario);
        console.log('  Email:', user.email);
        console.log('  Nombre:', user.nombre);
        console.log('  Rol:', user.rol);
        console.log('  Hash:', user.contrasena_hash.substring(0, 20) + '...\n');

        // Probar si la contraseña coincide
        const contrasena = 'Admin123@';
        console.log('🔐 Probando contraseña:', contrasena);
        const isMatch = await bcrypt.compare(contrasena, user.contrasena_hash);
        
        if (isMatch) {
            console.log('✅ ¡La contraseña es CORRECTA!\n');
        } else {
            console.log('❌ La contraseña NO coincide\n');
            
            // Intentar rehashear
            console.log('🔄 Creando nuevo hash para verificación...');
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(contrasena, salt);
            console.log('Nuevo hash:', newHash + '\n');
        }

        // Listar todos los usuarios
        console.log('📋 Todos los usuarios:');
        const allUsers = await pool.query(
            'SELECT email, nombre, rol FROM usuarios'
        );
        
        allUsers.rows.forEach(u => {
            console.log(`  • ${u.email} - ${u.nombre} (${u.rol})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testLogin();
