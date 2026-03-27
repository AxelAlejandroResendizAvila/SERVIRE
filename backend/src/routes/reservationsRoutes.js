import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import * as reservationsController from '../controllers/reservationsController.js';

const router = express.Router();

router.post('/', authMiddleware, reservationsController.createReservation);
router.get('/mis-reservas', authMiddleware, reservationsController.getMyReservations);
router.get('/admin', reservationsController.getAdminRequests);
router.put('/:id/aprobar', authMiddleware, reservationsController.approveReservation);
router.put('/:id/rechazar', authMiddleware, reservationsController.declineReservation);
router.put('/liberar/:spaceId', authMiddleware, reservationsController.freeSpace);

export default router;
