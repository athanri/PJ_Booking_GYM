import { Router } from 'express';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';   
import { parseISO, eachDayUTC, ymd } from '../utils/dates.js';
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

// GET /api/listings/:id/availability?start=YYYY-MM-DD&end=YYYY-MM-DD (end exclusive)
router.get('/:id/availability', async (req, res) => {
    const { id } = req.params;
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: 'start and end are required' });

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const s = parseISO(start);
    const e = parseISO(end);
    if (isNaN(s) || isNaN(e) || s >= e) return res.status(400).json({ message: 'Invalid dates' });


    const bookings = await Booking.find({
        listing: id,
        status: { $ne: 'cancelled' },
        start: { $lt: e },
        end: { $gt: s }
    }).select('start end');

    const counts = new Map();
    for (const b of bookings) {
        for (const d of eachDayUTC(new Date(b.start), new Date(b.end))) {
            const key = ymd(d);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    const result = {};
    for (const d of eachDayUTC(s, e)) {
        const key = ymd(d);
        const used = counts.get(key) || 0;
        result[key] = Math.max(0, (listing.capacity || 1) - used);
    }

    res.json({ capacity: listing.capacity || 1, days: result });
});

// simple create/update for admins could be added later
export default router;