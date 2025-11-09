import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Sessions-only now:
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    // Keep start/end for convenience & sorting
    start: { type: Date, required: true },
    end:   { type: Date, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
  },
  { timestamps: true }
);

// Prevent double-booking same session by same user
bookingSchema.index({ user: 1, session: 1 }, { unique: true });

export default mongoose.model('Booking', bookingSchema);
