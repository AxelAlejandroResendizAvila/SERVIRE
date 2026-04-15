import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No se envió un token de acceso, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servire_secret_key');
        req.usuario = decoded.id;
        req.rol = decoded.rol;
        next();
    } catch (err) {
        res.status(401).json({ error: 'El token no es válido' });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (req.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso restringido: Se requiere rol de administrador' });
    }
    next();
};

// Middleware que permite acceso a admin Y operadores
export const adminOrOperadorMiddleware = (req, res, next) => {
    if (req.rol !== 'admin' && req.rol !== 'operador') {
        return res.status(403).json({ error: 'Acceso restringido: Se requiere rol de administrador u operador' });
    }
    next();
};

export default authMiddleware;
