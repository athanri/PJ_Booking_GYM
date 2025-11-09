import { useGetListingsQuery } from '../features/listings/listingsApi';
import { useCreateBookingMutation } from '../features/bookings/bookingsApi';
import React, { useState } from 'react';

export default function ListingsPage() {
    const { data: listings = [], isLoading } = useGetListingsQuery();
    const [createBooking] = useCreateBookingMutation();
    const [datesById, setDatesById] = useState({});

    if (isLoading) return <p>Loading...</p>;

    const handleBook = async (id) => {
        const { start, end } = datesById[id] || {};
        if (!start || !end) return alert('Pick dates');
        try {
            await createBooking({ listingId: id, start, end }).unwrap();
            alert('Booked!');
        } catch (e) {
            alert(e.data?.message || 'Booking failed');
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '2rem auto' }}>
            <h2>Listings</h2>
            <ul>
                {listings.map((l) => (
                <li key={l._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12 }}>
                    <h3>{l.title} — €{l.price}/night</h3>
                    <p>{l.description}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input type="date" onChange={(e)=> setDatesById((s)=>({ ...s, [l._id]: { ...(s[l._id]||{}), start: e.target.value }}))} />
                        <input type="date" onChange={(e)=> setDatesById((s)=>({ ...s, [l._id]: { ...(s[l._id]||{}), end: e.target.value }}))} />
                        <button onClick={()=>handleBook(l._id)}>Book</button>
                    </div>
                </li>
                ))}
            </ul>
        </div>
    );
}