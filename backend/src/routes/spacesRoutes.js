import express from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import * as spacesController from '../controllers/spacesController.js';

const router = express.Router();

router.get('/categorias', spacesController.getCategories);
router.get('/edificios', spacesController.getEdificios);
router.get('/', spacesController.getAllSpaces);
router.get('/:id', spacesController.getSpaceById);

router.post('/', authMiddleware, adminMiddleware, upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), spacesController.createSpace);

router.put('/:id', authMiddleware, adminMiddleware, upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), spacesController.updateSpace);

router.delete('/imagen/:imageId', authMiddleware, adminMiddleware, spacesController.deleteImage);
router.delete('/:id', authMiddleware, adminMiddleware, spacesController.deleteSpace);

export default router;
