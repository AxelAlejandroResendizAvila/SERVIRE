import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import spacesRoutes from './routes/spacesRoutes.js';
import reservationsRoutes from './routes/reservationsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/espacios', spacesRoutes);
app.use('/api/reservas', reservationsRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('API de SERVIRE funcionando correctamente.');
});

app.listen(PORT, () => {
    console.log(`Server corriendo en el puerto ${PORT}`);
});
