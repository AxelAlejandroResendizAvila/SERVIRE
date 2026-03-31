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

async function updateAndCreateUsers() {
    try {
        console.log('👥 Actualizando roles de usuarios existentes...\n');

        // Actualizar usuarios existentes a rol 'usuario'
        await pool.query(
            'UPDATE usuarios SET rol = \'usuario\' WHERE rol IS NULL'
        );
        console.log('✅ Roles actualizados a "usuario"\n');

        // Crear usuario de prueba regular
        console.log('📝 Creando usuario de prueba...');
        
        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash('Usuario123@', salt);

        const userResult = await pool.query(
            `INSERT INTO usuarios (nombre, apellidos, email, contrasena_hash, telefono, rol) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (email) DO UPDATE SET rol = 'usuario'
             RETURNING id_usuario, nombre, email, rol`,
            ['Usuario', 'Prueba', 'usuario@servire.com', contrasena_hash, '1111111111', 'usuario']
        );

        console.log('✅ Usuario de prueba creado\n');

        // Ver todos los usuarios
        console.log('📊 USUARIOS EN LA BASE DE DATOS:\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ Email                 │ Nombre              │ Rol        ║');
        console.log('╠════════════════════════════════════════════════════════════╣');

        const allUsers = await pool.query(
            'SELECT email, nombre, apellidos, rol FROM usuarios ORDER BY rol DESC'
        );

        allUsers.rows.forEach(user => {
            const email = user.email.padEnd(22);
            const name = `${user.nombre} ${user.apellidos}`.substring(0, 19).padEnd(20);
            const role = (user.rol || 'usuario').padEnd(10);
            console.log(`║ ${email}│ ${name}│ ${role}║`);
        });
        
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('🎯 CREDENCIALES DISPONIBLES:\n');
        console.log('ADMINISTRADOR:');
        console.log('  • Email: admin@servire.com');
        console.log('  • Contraseña: Admin123@\n');
        console.log('USUARIO REGULAR:');
        console.log('  • Email: usuario@servire.com');
        console.log('  • Contraseña: Usuario123@');
        
    } catch (error) {
        if (error.code === '23505') {
            console.log('ℹ️  Usuario ya existe (ignorado)');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await pool.end();
    }
}

updateAndCreateUsers();
