import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import * as reservationsController from '../controllers/reservationsController.js';

const router = express.Router();

// Rutas específicas primero
router.get('/mis-reservas', authMiddleware, reservationsController.getMyReservations);
router.get('/admin', reservationsController.getAdminRequests);

// Rutas con parámetro :id
router.post('/', authMiddleware, reservationsController.createReservation);
router.put('/:id/aprobar', authMiddleware, reservationsController.approveReservation);
router.put('/:id/rechazar', authMiddleware, reservationsController.declineReservation);
router.delete('/:id', authMiddleware, reservationsController.cancelUserReservation);
router.put('/liberar/:spaceId', authMiddleware, reservationsController.freeSpace);

export default router;
