import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import spacesRoutes from './routes/spacesRoutes.js';
import reservationsRoutes from './routes/reservationsRoutes.js';
import { startCronJobs } from './cron/cleaner.js';
import { enforceSingleAdmin } from './utils/adminEnforcement.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/espacios', spacesRoutes);
app.use('/api/reservas', reservationsRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('API de SERVIRE funcionando correctamente.');
});

// Iniciar servidor
const bootstrap = async () => {
    try {
        await enforceSingleAdmin();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server corriendo en puerto ${PORT}`);
            startCronJobs();
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error.message);
        process.exit(1);
    }
};

bootstrap();

