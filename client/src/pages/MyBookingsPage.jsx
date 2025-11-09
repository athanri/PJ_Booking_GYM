import { useGetMyBookingsQuery } from '../features/bookings/bookingsApi';
import React from 'react';

export default function MyBookingsPage() {
const { data = [], isLoading, error } = useGetMyBookingsQuery();


if (isLoading) return <p>Loading...</p>;
if (error) return <p style={{ color: 'crimson' }}>Failed to load bookings</p>;
if (!data.length) return <p>No bookings yet.</p>;


return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
        <h2>My Bookings</h2>
        <ul>
            {data.map((b) => {
            const title = b.listing?.title ?? 'Listing unavailable';
            const start = b.start ? new Date(b.start) : null;
            const end = b.end ? new Date(b.end) : null;
            return (
            <li key={b._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12 }}>
                <strong>{title}</strong>
                <div>{start ? start.toLocaleDateString() : '—'} → {end ? end.toLocaleDateString() : '—'}</div>
                <div>Total: €{b.total ?? 0}</div>
            </li>
            );
            })}
        </ul>
    </div>
);
}