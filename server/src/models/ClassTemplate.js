import mongoose from 'mongoose';

const classTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },            // e.g., "Spin 45"
  instructor: { type: String, required: true },      // simple string for now
  location: { type: String, default: 'Main Studio' },
  durationMins: { type: Number, default: 60 },
  capacity: { type: Number, default: 20 },
  price: { type: Number, default: 12 },
  // simple recurrence: days of week 0..6 (Sun..Sat) and start time "HH:MM"
  recurDays: { type: [Number], default: [] },        // e.g., [1,3,5] for Mon/Wed/Fri
  startTime: { type: String, default: '18:00' },     // 24h "HH:MM"
  // blackout dates for this class (UTC date-only)
  blackoutDates: { type: [Date], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('ClassTemplate', classTemplateSchema);
