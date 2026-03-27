import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import spacesRoutes from './routes/spacesRoutes.js';
import reservationsRoutes from './routes/reservationsRoutes.js';

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server corriendo en el puerto ${PORT}`);
});

