import { Router } from 'express';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const router = Router();

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email in use' });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });
    const token = generateToken({ id: user._id, email: user.email, name: user.name });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken({ id: user._id, email: user.email, name: user.name });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});


export default router;