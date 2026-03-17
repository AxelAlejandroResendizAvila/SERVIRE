import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No se envió un token de acceso, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ error: 'El token no es válido' });
    }
};

export default authMiddleware;
