import { api } from '../../app/api';


export const bookingsApi = api.injectEndpoints({
    endpoints: (build) => ({
        createBooking: build.mutation({
        query: ({ listingId, start, end }) => ({ url: '/bookings', method: 'POST', body: { listingId, start, end } }),
        invalidatesTags: ['Booking']
        }),
        getMyBookings: build.query({
            query: () => '/bookings/me',
            providesTags: ['Booking']
        }),
        cancelBooking: build.mutation({
            query: (id) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH' }),
            invalidatesTags: ['Booking']
        }),
        createSessionBooking: build.mutation({
            query: ({ sessionId }) => ({ url: `/session-bookings`, method: 'POST', body: { sessionId } }),
            invalidatesTags: ['Booking','Session']
        }),
        joinWaitlist: build.mutation({
            query: ({ sessionId }) => ({ url: `/waitlist`, method: 'POST', body: { sessionId } }),
            invalidatesTags: ['Waitlist','Session']
        }),
        leaveWaitlist: build.mutation({
            query: (sessionId) => ({ url: `/waitlist/${sessionId}`, method: 'DELETE' }),
            invalidatesTags: ['Waitlist']
        }),
        getMyWaitlist: build.query({
            query: () => `/waitlist/me`,
            providesTags: ['Waitlist']
        }),
    })
});


export const {
    useCreateBookingMutation,
    useGetMyBookingsQuery,
    useCancelBookingMutation,
    useCreateSessionBookingMutation,
    useJoinWaitlistMutation,
    useLeaveWaitlistMutation,
    useGetMyWaitlistQuery,
} = bookingsApi;