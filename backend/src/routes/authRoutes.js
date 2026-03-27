import express from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', authController.changePassword);
router.get('/me', authMiddleware, authController.getMe);

export default router;
