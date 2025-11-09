import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';


export const generateToken = (payload, expiresIn = '7d') =>
    jwt.sign(payload, JWT_SECRET, { expiresIn });