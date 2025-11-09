import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    // for time-based bookings, expose available slots or capacity in a real app
    capacity: { type: Number, default: 1 },
    location: String
},
{ timestamps: true });

export default mongoose.model('Listing', listingSchema);