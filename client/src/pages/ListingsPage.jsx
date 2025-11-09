import React from 'react';
import { useGetListingsQuery } from '../features/listings/listingsApi';
import ListingCard from '../components/ListingCard.jsx';

export default function ListingsPage() {
    const { data: listings = [], isLoading } = useGetListingsQuery();
    if (isLoading) return <p>Loading...</p>;
    return (
        <div style={{ maxWidth: 900, margin: '2rem auto' }}>
            <h2>Listings</h2>
            <ul>
                {listings.map((l) => (
                    <ListingCard key={l._id} listing={l} />
                ))}
            </ul>
        </div>
    );
}