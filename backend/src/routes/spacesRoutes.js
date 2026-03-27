import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import * as spacesController from '../controllers/spacesController.js';

const router = express.Router();

router.get('/categorias', spacesController.getCategories);
router.get('/', spacesController.getAllSpaces);
router.get('/:id', spacesController.getSpaceById);

router.post('/', authMiddleware, upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), spacesController.createSpace);

router.put('/:id', authMiddleware, upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), spacesController.updateSpace);

router.delete('/imagen/:imageId', authMiddleware, spacesController.deleteImage);
router.delete('/:id', authMiddleware, spacesController.deleteSpace);

export default router;
