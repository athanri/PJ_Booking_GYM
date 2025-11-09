import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: false },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession' }, // NEW
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' }
},
{ timestamps: true });

bookingSchema.index({ user: 1, session: 1 }, { unique: true, partialFilterExpression: { session: { $type: 'objectId' } } });

export default mongoose.model('Booking', bookingSchema);