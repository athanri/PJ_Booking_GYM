import { api } from '../../app/api';

export const bookingsApi = api.injectEndpoints({
    endpoints: (build) => ({
        createBooking: build.mutation({
            query: ({ listingId, start, end }) => ({
                url: '/bookings',
                method: 'POST',
                body: { listingId, start, end }
            }),
            invalidatesTags: ['Booking']
        }),
        getMyBookings: build.query({
            query: () => '/bookings/me',
            providesTags: ['Booking']
        })
    })
});

export const { useCreateBookingMutation, useGetMyBookingsQuery } = bookingsApi;