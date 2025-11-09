import { useGetMyBookingsQuery } from '../features/bookings/bookingsApi';

export default function MyBookingsPage() {
    const { data = [], isLoading } = useGetMyBookingsQuery();
    if (isLoading) return <p>Loading...</p>;
    return (
        <div style={{ maxWidth: 800, margin: '2rem auto' }}>
            <h2>My Bookings</h2>
            <ul>
                {data.map((b) => (
                <li key={b._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12 }}>
                    <strong>{b.listing.title}</strong>
                    <div>{new Date(b.start).toLocaleDateString()} → {new Date(b.end).toLocaleDateString()}</div>
                    <div>Total: €{b.total}</div>
                </li>
                ))}
            </ul>
        </div>
    );
}