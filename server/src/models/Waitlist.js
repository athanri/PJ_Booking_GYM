import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One entry per user per session
waitlistSchema.index({ session: 1, user: 1 }, { unique: true });
// Promote by oldest first
waitlistSchema.index({ session: 1, createdAt: 1 });

export default mongoose.model('Waitlist', waitlistSchema);
