import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ClassSession from '../models/ClassSession.js';
import Waitlist from '../models/Waitlist.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** GET /api/bookings/me — my session bookings */
router.get('/me', requireAuth, async (req, res) => {
  const items = await Booking.find({ user: req.user.id })
    .populate({ path: 'session', populate: 'template' })
    .sort({ start: -1 });
  res.json(items);
});

/** PATCH /api/bookings/:id/cancel — cancel a future booking and promote waitlist */
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid booking id' });

  const booking = await Booking.findById(id).populate({ path: 'session', populate: 'template' });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user) !== String(req.user.id)) return res.status(403).json({ message: 'Not allowed' });
  if (booking.status === 'cancelled') return res.status(409).json({ message: 'Already cancelled' });
  if (new Date(booking.start) <= new Date()) return res.status(400).json({ message: 'Cannot cancel past/ongoing.' });

  booking.status = 'cancelled';
  await booking.save();

  // Free a spot
  await ClassSession.updateOne(
    { _id: booking.session, spotsTaken: { $gt: 0 } },
    { $inc: { spotsTaken: -1 } }
  );

  // Promote first waitlisted user (best-effort)
  const entry = await Waitlist.findOneAndDelete({ session: booking.session }).sort({ createdAt: 1 });
  if (entry) {
    const session = await ClassSession.findOneAndUpdate(
      { _id: booking.session, status: 'scheduled', $expr: { $lt: ['$spotsTaken', '$capacity'] } },
      { $inc: { spotsTaken: 1 } },
      { new: true }
    ).populate('template');
    if (session) {
      await Booking.create({
        user: entry.user,
        session: session._id,
        start: session.start,
        end: session.end,
        total: session.price,
        status: 'confirmed',
      });
    } else {
      // Couldn’t claim; put them back (optional)
      try { await Waitlist.create({ session: booking.session, user: entry.user }); } catch (_) {}
    }
  }

  res.json(booking);
});

export default router;