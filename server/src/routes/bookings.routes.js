import { Router } from 'express';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// create booking
router.post('/', requireAuth, async (req, res) => {
    const { listingId, start, end } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e) || s >= e) return res.status(400).json({ message: 'Invalid dates' });


    // naive conflict check (improve later)
    const conflict = await Booking.findOne({ listing: listingId, start: { $lt: e }, end: { $gt: s }, status: { $ne: 'cancelled' } });
    if (conflict) return res.status(409).json({ message: 'Time slot already booked' });


    const nights = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    const total = nights * listing.price;


    const booking = await Booking.create({ user: req.user.id, listing: listingId, start: s, end: e, total, status: 'confirmed' });
    res.status(201).json(await booking.populate('listing'));
});

// my bookings
router.get('/me', requireAuth, async (req, res) => {
    const items = await Booking.find({ user: req.user.id }).populate('listing').sort({ start: -1 });
    res.json(items);
});

export default router;