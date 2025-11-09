import { Router } from 'express';
import mongoose from 'mongoose';
import ClassSession from '../models/ClassSession.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/session-bookings
 * Body: { sessionId }
 * - Atomically increments spotsTaken if capacity allows
 * - Creates Booking { user, session, start, end, total }
 * - Prevents duplicate booking per user+session
 */
router.post('/', requireAuth, async (req, res) => {
  const { sessionId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ message: 'Invalid session id' });
  }

  // prevent user double-booking this session
  const dup = await Booking.findOne({ user: req.user.id, session: sessionId, status: { $ne: 'cancelled' } });
  if (dup) return res.status(409).json({ message: 'You are already booked on this class.' });

  // atomically claim a spot
  const session = await ClassSession.findOneAndUpdate(
    { _id: sessionId, status: 'scheduled', $expr: { $lt: ['$spotsTaken', '$capacity'] } },
    { $inc: { spotsTaken: 1 } },
    { new: true }
  ).populate('template');

  if (!session) {
    return res.status(409).json({ message: 'Class is full or unavailable.' });
  }

  const total = session.price;
  const booking = await Booking.create({
    user: req.user.id,
    session: session._id,
    start: session.start,
    end: session.end,
    total,
    status: 'confirmed',
  });

  res.status(201).json(await booking.populate({ path: 'session', populate: 'template' }));
});

export default router;
