import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', authController.changePassword);
router.get('/me', authMiddleware, authController.getMe);

// Rutas de administración de usuarios
router.get('/users', authMiddleware, adminMiddleware, authController.getAllUsers);
router.put('/users/role', authMiddleware, adminMiddleware, authController.updateUserRole);

export default router;
