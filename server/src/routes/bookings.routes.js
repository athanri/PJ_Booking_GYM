// server/src/routes/bookings.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';
import { parseISO, eachDayUTC, ymd } from '../utils/dates.js';

const router = Router();

/**
 * Compute remaining capacity per day for a listing across [start, end)
 * Respects Listing.capacity and counts overlapping bookings.
 */
async function getRemainingByDay(listing, start, end) {
  const bookings = await Booking.find({
    listing: listing._id,
    status: { $ne: 'cancelled' },
    // overlap condition: (booking.start < requested.end) && (booking.end > requested.start)
    start: { $lt: end },
    end: { $gt: start }
  }).select('start end');

  const counts = new Map();
  for (const b of bookings) {
    for (const d of eachDayUTC(new Date(b.start), new Date(b.end))) {
      const key = ymd(d);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const result = {};
  for (const d of eachDayUTC(start, end)) {
    const key = ymd(d);
    const used = counts.get(key) || 0;
    result[key] = Math.max(0, (listing.capacity || 1) - used);
  }
  return result;
}

/**
 * POST /api/bookings
 * Body: { listingId, start, end }
 * - Validates ObjectId, date range
 * - Prevents same-user overlapping bookings for the same listing
 * - Enforces per-day capacity across the requested range
 */
router.post('/', requireAuth, async (req, res) => {
  const { listingId, start, end } = req.body;
  if (!mongoose.Types.ObjectId.isValid(listingId)) return res.status(400).json({ message: 'Invalid listing id' });

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  const s = parseISO(start), e = parseISO(end);
  if (isNaN(s) || isNaN(e) || s >= e) return res.status(400).json({ message: 'Invalid dates' });

  // minimum stay
  const nights = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  const minStay = listing.minStay || 1;
  if (nights < minStay) return res.status(400).json({ message: `Minimum stay is ${minStay} night(s).` });

  // blackout overlap: if any day intersects, reject
  const blackoutSet = new Set((listing.blackoutDates || []).map((d) => ymd(new Date(d))));
  const intersectsBlackout = eachDayUTC(s, e).some((d) => blackoutSet.has(ymd(d)));
  if (intersectsBlackout) return res.status(409).json({ message: 'Selected dates include a blackout date.' });

  // same-user overlap guard
  const existing = await Booking.findOne({ user: req.user.id, listing: listingId, start: { $lt: e }, end: { $gt: s }, status: { $ne: 'cancelled' } });
  if (existing) return res.status(409).json({ message: 'You already have a booking overlapping these dates for this listing.' });

  // capacity check
  const remaining = await getRemainingByDay(listing, s, e);
  const soldOutDay = Object.entries(remaining).find(([, rem]) => rem <= 0);
  if (soldOutDay) return res.status(409).json({ message: `Sold out on ${soldOutDay[0]}` });

  const total = nights * listing.price;
  const booking = await Booking.create({ user: req.user.id, listing: listingId, start: s, end: e, total, status: 'confirmed' });
  res.status(201).json(await booking.populate('listing'));
});

/**
 * GET /api/bookings/me
 * Returns the current user's bookings (most recent first)
 */
router.get('/me', requireAuth, async (req, res) => {
  const items = await Booking.find({ user: req.user.id })
    .populate('listing')
    .sort({ start: -1 });
  res.json(items);
});

// PATCH /api/bookings/:id/cancel — user can cancel their own upcoming booking
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid booking id' });


  const booking = await Booking.findById(id).populate('listing');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user) !== String(req.user.id)) return res.status(403).json({ message: 'Not allowed' });
  if (booking.status === 'cancelled') return res.status(409).json({ message: 'Already cancelled' });


  // optionally disallow cancelling past bookings
  if (new Date(booking.start) <= new Date()) return res.status(400).json({ message: 'Cannot cancel past or ongoing bookings.' });


  booking.status = 'cancelled';
  await booking.save();
  res.json(booking);
});

export default router;
