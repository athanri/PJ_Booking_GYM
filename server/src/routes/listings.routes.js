import { Router } from 'express';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// seed a few demo listings (dev only)
router.post('/seed', async (_, res) => {
    const data = [
        { title: 'Cozy Studio', description: 'City center', price: 80, capacity: 2, location: 'Dublin' },
        { title: 'Beach House', description: 'Sea view', price: 220, capacity: 6, location: 'Galway' }
    ];
    await Listing.deleteMany({});
    const out = await Listing.insertMany(data);
    res.json(out);
});

router.get('/', async (req, res) => {
    const items = await Listing.find().sort({ createdAt: -1 });
    res.json(items);
});

router.get('/:id', async (req, res) => {
    const item = await Listing.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
});

// simple create/update for admins could be added later
export default router;