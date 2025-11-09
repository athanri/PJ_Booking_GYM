import React, { useState } from 'react';
import { useCreateBookingMutation } from '../features/bookings/bookingsApi';
import { useGetAvailabilityQuery } from '../features/availability/availabilityApi';
import AvailabilityCalendar from './AvailabilityCalendar.jsx';

function firstDayMonthStr(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`; }
function nextMonth(date) { return new Date(date.getFullYear(), date.getMonth()+1, 1); }

export default function ListingCard({ listing }) {
    const [createBooking] = useCreateBookingMutation();
    const [month, setMonth] = useState(new Date());
    const [range, setRange] = useState({ start: '', end: '' });


    const start = firstDayMonthStr(month);
    const end = firstDayMonthStr(nextMonth(month));
    const { data: avail } = useGetAvailabilityQuery({ listingId: listing._id, start, end });
    const minStay = avail?.minStay || 1;

    const handleBook = async () => {
        if (!range.start || !range.end) return alert('Pick dates');
        const nights = Math.ceil((new Date(range.end) - new Date(range.start)) / (1000*60*60*24));
        if (nights < minStay) return alert(`Minimum stay is ${minStay} night(s).`);
        try {
            await createBooking({ listingId: listing._id, start: range.start, end: range.end }).unwrap();
            alert('Booked!');
        } catch (err) {
            alert(err?.data?.message || 'Booking failed');
        }
    };

    return (
        <li style={{ border: '1px solid #ddd', padding: 16, marginBottom: 16 }}>
            <h3>{listing.title} — €{listing.price}/night (cap {listing.capacity})</h3>
            <div style={{ marginBottom: 8, opacity: 0.8 }}>Minimum stay: {minStay} night(s)</div>
            <p>{listing.description}</p>


            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                <div>
                    <label>Start</label>
                    <input type="date" value={range.start} onChange={(e)=> setRange((r)=>({ ...r, start: e.target.value }))} />
                    <label style={{ marginLeft: 12 }}>End</label>
                    <input type="date" value={range.end} onChange={(e)=> setRange((r)=>({ ...r, end: e.target.value }))} />
                    <button onClick={handleBook} style={{ marginLeft: 12 }}>Book</button>
                </div>
                <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
                        <button onClick={()=> setMonth((m)=> new Date(m.getFullYear(), m.getMonth()-1, 1))}>{'<'}</button>
                        <strong>{month.toLocaleString(undefined, { month:'long', year:'numeric' })}</strong>
                        <button onClick={()=> setMonth((m)=> new Date(m.getFullYear(), m.getMonth()+1, 1))}>{'>'}</button>
                    </div>
                    <AvailabilityCalendar
                        monthDate={month}
                        data={avail}
                        onSelectDay={(ymd) => {
                            setRange((r)=> r.start ? { ...r, end: ymd } : { ...r, start: ymd });
                        }}
                    />
                </div>
            </div>
        </li>
    );
}