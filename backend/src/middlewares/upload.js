import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar el almacenamiento en la nube
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'servire', // Carpeta donde se guardarán en Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Opcional: limitar tamaño
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

export default upload;
