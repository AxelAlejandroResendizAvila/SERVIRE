import express from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';
import * as reservationsController from '../controllers/reservationsController.js';

const router = express.Router();

// Rutas específicas primero
router.get('/mis-reservas', authMiddleware, reservationsController.getMyReservations);
router.get('/admin', authMiddleware, adminMiddleware, reservationsController.getAdminRequests);
router.get('/stats', authMiddleware, adminMiddleware, reservationsController.getReservationStats);

// Rutas con parámetro :id
router.post('/', authMiddleware, reservationsController.createReservation);
router.put('/:id/aprobar', authMiddleware, adminMiddleware, reservationsController.approveReservation);
router.put('/:id/rechazar', authMiddleware, adminMiddleware, reservationsController.declineReservation);
router.delete('/:id', authMiddleware, reservationsController.cancelUserReservation);
router.put('/liberar/:spaceId', authMiddleware, adminMiddleware, reservationsController.freeSpace);

export default router;