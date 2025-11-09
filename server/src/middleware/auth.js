import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'You are not logged in! Please login or register.' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};