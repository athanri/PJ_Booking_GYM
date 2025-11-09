import { Router } from 'express';
import mongoose from 'mongoose';
import Waitlist from '../models/Waitlist.js';
import ClassSession from '../models/ClassSession.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Join waitlist for a session
router.post('/', requireAuth, async (req, res) => {
  const { sessionId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) return res.status(400).json({ message: 'Invalid session id' });

  const session = await ClassSession.findById(sessionId);
  if (!session || session.status !== 'scheduled') return res.status(404).json({ message: 'Session not found' });

  // If there are still spots, tell client to book instead
  if (session.spotsTaken < session.capacity) {
    return res.status(409).json({ message: 'Spots available. Please book directly.' });
  }

  try {
    const wl = await Waitlist.create({ session: sessionId, user: req.user.id });
    return res.status(201).json(wl);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Already on waitlist.' });
    throw e;
  }
});

// Leave waitlist
router.delete('/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) return res.status(400).json({ message: 'Invalid session id' });

  await Waitlist.deleteOne({ session: sessionId, user: req.user.id });
  res.json({ ok: true });
});

// My waitlisted sessions
router.get('/me', requireAuth, async (req, res) => {
  const items = await Waitlist.find({ user: req.user.id })
    .populate({ path: 'session', populate: 'template' })
    .sort({ createdAt: 1 });
  res.json(items);
});

export default router;
