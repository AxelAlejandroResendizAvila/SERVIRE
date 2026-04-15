import express from 'express';
import { authMiddleware, adminOrOperadorMiddleware } from '../middlewares/auth.js';
import * as reservationsController from '../controllers/reservationsController.js';

const router = express.Router();

// Rutas específicas primero
router.get('/mis-reservas', authMiddleware, reservationsController.getMyReservations);
router.get('/admin', authMiddleware, adminOrOperadorMiddleware, reservationsController.getAdminRequests);
router.get('/stats', authMiddleware, adminOrOperadorMiddleware, reservationsController.getReservationStats);

// Rutas con parámetro :id
router.post('/', authMiddleware, reservationsController.createReservation);
router.put('/:id/aprobar', authMiddleware, adminOrOperadorMiddleware, reservationsController.approveReservation);
router.put('/:id/rechazar', authMiddleware, adminOrOperadorMiddleware, reservationsController.declineReservation);
router.delete('/:id', authMiddleware, reservationsController.cancelUserReservation);
router.put('/liberar/:spaceId', authMiddleware, adminOrOperadorMiddleware, reservationsController.freeSpace);

export default router;