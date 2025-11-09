import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { PORT, MONGO_URI, CLIENT_ORIGIN } from './config.js';
import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';


const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());


app.get('/', (_, res) => res.json({ ok: true, service: 'booking-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/bookings', bookingsRoutes);

mongoose.connect(MONGO_URI).then(() => {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})
.catch((err) => {
    console.error('Mongo connection error:', err);
    process.exit(1);
});