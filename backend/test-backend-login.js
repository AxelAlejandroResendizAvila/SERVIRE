import fetch from 'node-fetch';

async function testBackendLogin() {
    try {
        console.log('🔗 Probando conexión al backend...\n');
        console.log('📍 URL: http://localhost:3000/api/auth/login');
        console.log('📧 Email: admin@servire.com');
        console.log('🔑 Contraseña: Admin123@\n');

        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@servire.com',
                contrasena: 'Admin123@'
            })
        });

        console.log('📊 Respuesta del servidor:');
        console.log('  • Status:', response.status);
        console.log('  • Status Text:', response.statusText);

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ ¡Login exitoso!\n');
            console.log('📝 Datos retornados:');
            console.log('  • Token:', data.token.substring(0, 20) + '...');
            console.log('  • Usuario:', data.usuario.nombre);
            console.log('  • Rol:', data.usuario.rol);
            console.log('  • Email:', data.usuario.email);
        } else {
            console.log('\n❌ Error en login:');
            console.log('  • Mensaje:', data.error);
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('\n⚠️  El backend podría no estar corriendo en puerto 3000');
        console.log('    Verifica que hayas ejecutado: npm start en la carpeta backend');
    }
}

testBackendLogin();
