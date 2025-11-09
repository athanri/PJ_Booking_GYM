import { Router } from 'express';
import mongoose from 'mongoose';
import ClassTemplate from '../models/ClassTemplate.js';
import ClassSession from '../models/ClassSession.js';

const router = Router();

// seed a couple of templates
router.post('/seed', async (_req, res) => {
  await ClassSession.deleteMany({});
  await ClassTemplate.deleteMany({});

  const data = await ClassTemplate.insertMany([
    {
      name: 'Spin 45', instructor: 'Ava', location: 'Studio A',
      durationMins: 45, capacity: 18, price: 10,
      recurDays: [1,3,5], startTime: '18:00', blackoutDates: []
    },
    {
      name: 'HIIT 30', instructor: 'Max', location: 'Studio B',
      durationMins: 30, capacity: 20, price: 8,
      recurDays: [2,4], startTime: '07:30', blackoutDates: []
    },
  ]);

  res.json(data);
});

// helper: get next [from,to) window sessions for all active templates
function combineDateTime(date, hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(0,0,0,0);
  // interpret hh:mm as local time; adjust to UTC by using local setters
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0, 0);
  return local;
}

async function generateSessions(from, to) {
  const templates = await ClassTemplate.find({ isActive: true });
  const created = [];
  for (const t of templates) {
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay(); // 0..6
      if (!t.recurDays.includes(dow)) continue;

      // skip blackout
      const ymd = (x) => `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
      const blackoutYMD = new Set((t.blackoutDates||[]).map(dt => ymd(new Date(dt))));
      if (blackoutYMD.has(ymd(d))) continue;

      const start = combineDateTime(d, t.startTime);
      const end = new Date(start.getTime() + t.durationMins * 60 * 1000);

      try {
        const sess = await ClassSession.updateOne(
          { template: t._id, start },
          { $setOnInsert: {
              template: t._id,
              start, end,
              capacity: t.capacity,
              price: t.price,
              spotsTaken: 0,
              status: 'scheduled'
          }},
          { upsert: true }
        );
        if (sess.upsertedCount) created.push({ template: t._id, start });
      } catch (e) {
        // ignore duplicate errors due to concurrent upserts
      }
    }
  }
  return created;
}

// materialize sessions for a window (default next 14 days)
router.post('/sessions/generate', async (req, res) => {
  const from = req.body?.from ? new Date(req.body.from) : new Date();
  const to   = req.body?.to   ? new Date(req.body.to)   : new Date(Date.now() + 14*24*60*60*1000);
  const out = await generateSessions(from, to);
  res.json({ created: out.length });
});

// list sessions in a range
router.get('/sessions', async (req, res) => {
  const { from, to, instructor } = req.query;
  const start = from ? new Date(from) : new Date();
  const end   = to   ? new Date(to)   : new Date(Date.now() + 7*24*60*60*1000);

  const q = { start: { $gte: start }, end: { $lte: end }, status: 'scheduled' };
  if (instructor) q['$expr'] = { $eq: [ '$$T.instructor', instructor ] }; // simple filter via populate alt below

  const sessions = await ClassSession.find(q)
    .populate('template')
    .sort({ start: 1 });

  // compute remaining
  const mapped = sessions.map(s => ({
    _id: s._id,
    start: s.start,
    end: s.end,
    capacity: s.capacity,
    price: s.price,
    status: s.status,
    template: {
      _id: s.template?._id,
      name: s.template?.name,
      instructor: s.template?.instructor,
      location: s.template?.location,
      durationMins: s.template?.durationMins,
    },
    spotsRemaining: Math.max(0, s.capacity - s.spotsTaken),
  }));

  res.json(mapped);
});

// list templates
router.get('/templates', async (_req, res) => {
  const items = await ClassTemplate.find({}).sort({ name: 1 });
  res.json(items);
});

export default router;
