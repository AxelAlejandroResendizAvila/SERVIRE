import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, adminMiddleware, adminOrOperadorMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, authController.changePassword);
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.get('/me', authMiddleware, authController.getMe);

// Rutas de administración de usuarios (admin y operadores pueden ver la lista)
router.get('/users', authMiddleware, adminOrOperadorMiddleware, authController.getAllUsers);

// Solo admin puede cambiar roles de operador
router.put('/users/toggle-operador', authMiddleware, adminMiddleware, authController.toggleOperador);

// Transferir admin (requiere contraseña + frase)
router.post('/transfer-admin', authMiddleware, adminMiddleware, authController.transferAdmin);

// Bloquear/desbloquear usuario (admin u operador)
router.put('/users/toggle-block', authMiddleware, adminOrOperadorMiddleware, authController.toggleBlockUser);

// Eliminar usuario (solo admin)
router.delete('/users/:userId', authMiddleware, adminMiddleware, authController.deleteUser);

export default router;
